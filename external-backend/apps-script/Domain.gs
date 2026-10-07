/* Pure business rules, independent of Google persistence and network. */
function consent_(x,now) {
  keys_(x,['service','followup','review','at','version','source']);
  ['service','followup','review'].forEach(function(k) {
    assert_(typeof x[k]==='boolean','INVALID_CONSENT');
  });
  assert_(x.service===true,'SERVICE_CONSENT_REQUIRED');
  var at=date_(x.at);
  assert_(at<=now+300000 && at>=now-86400000,'INVALID_CONSENT_TIME');
  assert_(x.version==='demo-email-v1' && x.source==='demo-form','INVALID_CONSENT_PROOF');
  return copy_(x);
}
function details_(d,now) {
  assert_(d.branch_id==='DEMO_BRANCH','INVALID_BRANCH');
  var n=date_(d.preferred_at);
  assert_(n>now && n<now+90*86400000,'INVALID_PREFERRED_TIME');
  return {branch_id:d.branch_id,preferred_at:iso_(n)};
}
function audit_(r,type,now,role) {
  r.audit.push({type:type,at:iso_(now),role:role,version:r.version});
  if(r.audit.length>100) r.audit.shift();
}
function cancelJobs_(r,kinds,reason) {
  r.jobs.forEach(function(j) {
    if(j.status==='PENDING' && (!kinds || kinds.indexOf(j.kind)>=0)) {
      j.status='CANCELLED'; j.reason=reason;
    }
  });
}
function queue_(r,kind,due,expires,c) {
  assert_(r.jobs.length<c.maxJobs,'DEMO_JOB_LIMIT');
  var id=kind+':'+r.version;
  assert_(!r.jobs.some(function(j){return j.id===id;}),'JOB_CONFLICT');
  r.jobs.push({id:id,kind:kind,status:'PENDING',due_at:iso_(due),
    expires_at:iso_(expires),revision:r.appointment_revision,
    attempts:0,reason:'',channel:'email'});
}
function make_(body,now,c) {
  var d=body.data;
  keys_(d,['is_test','name','email','phase','branch_id','preferred_at','consent','phone']);
  assert_(d.is_test===true,'TEST_DATA_REQUIRED');
  assert_(['INCOMPLETE','SUBMITTED'].indexOf(d.phase)>=0,'INVALID_PHASE');
  var email=email_(d.email);
  assert_(c.allowed.indexOf(email)>=0,'RECIPIENT_NOT_ALLOWED');
  var consent=consent_(d.consent,now);
  // Step-1 capture: name + email + phone are stored the moment the visitor
  // presses "التالي", so an abandoned attempt still yields a saved lead.
  var phone=d.phone===undefined?'':phone_(d.phone);
  var r={schema:1,id:body.request_id,reference:'TD-'+body.request_id,is_test:true,
    name:text_(d.name,60,'INVALID_NAME'),email:email,phone:phone,consent:consent,status:d.phase,
    created_at:iso_(now),updated_at:iso_(now),version:1,appointment_revision:0,
    appointment_at:null,replied:false,stopped:false,owner:'DEMO_RECEPTION',
    jobs:[],events:[],audit:[],details:null};
  if(d.phase==='SUBMITTED') r.details=details_(d,now);
  else {
    assert_(d.branch_id===undefined && d.preferred_at===undefined,'UNEXPECTED_FIELD');
    assert_(consent.followup===true,'FOLLOWUP_CONSENT_REQUIRED');
    queue_(r,'FOLLOWUP',now+(c.fast?180000:3600000),now+86400000,c);
  }
  queue_(r,'RECEIPT',now,now+86400000,c); return r;
}
function eligible_(r,j,suppressed) {
  if(suppressed || r.stopped || !r.consent.service) return false;
  if(['CANCELLED','CLOSED','NO_SHOW'].indexOf(r.status)>=0) return false;
  if(j.kind==='RECEIPT')
    return ['INCOMPLETE','SUBMITTED','UNDER_REVIEW'].indexOf(r.status)>=0;
  if(j.kind==='FOLLOWUP')
    return r.status==='INCOMPLETE' && !r.replied && r.consent.followup;
  if(j.kind==='CONFIRMATION' || j.kind==='REMINDER')
    return r.status==='CONFIRMED' && j.revision===r.appointment_revision;
  if(j.kind==='REVIEW') return r.status==='ATTENDED' && r.consent.review;
  return false;
}
function transition_(old,body,role,now,c) {
  var r=copy_(old),d=body.data,t=body.type;
  if(t==='request.complete') keys_(d,['expected_version','branch_id','preferred_at']);
  else if(t==='request.confirm' || t==='request.reschedule')
    keys_(d,['expected_version','appointment_at']);
  else if(t==='request.close') keys_(d,['expected_version','reason']);
  else keys_(d,['expected_version']);
  assert_(Number.isInteger(d.expected_version) && d.expected_version===r.version,
    'VERSION_CONFLICT');
  assert_(r.events.length<c.maxEvents,'DEMO_EVENT_LIMIT');
  r.version++; r.updated_at=iso_(now);
  var active=['INCOMPLETE','SUBMITTED','UNDER_REVIEW','CONFIRMED','CHANGE_REQUESTED'];
  if(t==='request.complete') {
    assert_(r.status==='INCOMPLETE','INVALID_TRANSITION');
    r.details=details_(d,now); r.status='SUBMITTED';
    cancelJobs_(r,['FOLLOWUP','RECEIPT'],'FORM_COMPLETED');
    queue_(r,'RECEIPT',now,now+86400000,c);
  } else if(t==='request.review') {
    assert_(r.status==='SUBMITTED','INVALID_TRANSITION'); r.status='UNDER_REVIEW';
  } else if(t==='request.confirm' || t==='request.reschedule') {
    var permitted=t==='request.confirm'?
      ['SUBMITTED','UNDER_REVIEW','CHANGE_REQUESTED']:['CONFIRMED'];
    assert_(permitted.indexOf(r.status)>=0,'INVALID_TRANSITION');
    var appt=date_(d.appointment_at);
    assert_(appt>now+60000 && appt<now+90*86400000,'INVALID_APPOINTMENT');
    r.status='CONFIRMED'; r.appointment_at=iso_(appt); r.appointment_revision++;
    cancelJobs_(r,null,'APPOINTMENT_UPDATED');
    queue_(r,'CONFIRMATION',now,appt,c);
    var due=c.fast?now+180000:appt-86400000;
    if(due>now && due<appt) queue_(r,'REMINDER',due,appt,c);
  } else if(t==='request.change_requested') {
    assert_(r.status==='CONFIRMED','INVALID_TRANSITION');
    r.status='CHANGE_REQUESTED'; cancelJobs_(r,null,'CHANGE_REQUESTED');
  } else if(t==='request.replied') {
    assert_(active.indexOf(r.status)>=0,'INVALID_TRANSITION');
    r.replied=true; cancelJobs_(r,['FOLLOWUP'],'REPLIED');
  } else if(t==='request.cancel') {
    assert_(active.indexOf(r.status)>=0,'INVALID_TRANSITION');
    r.status='CANCELLED'; cancelJobs_(r,null,'CANCELLED');
  } else if(t==='request.attended' || t==='request.no_show') {
    assert_(r.status==='CONFIRMED','INVALID_TRANSITION');
    r.status=t==='request.attended'?'ATTENDED':'NO_SHOW';
    cancelJobs_(r,null,r.status);
    if(r.status==='ATTENDED' && r.consent.review)
      queue_(r,'REVIEW',now+(c.fast?120000:86400000),now+7*86400000,c);
  } else if(t==='request.close') {
    assert_(r.status!=='CLOSED','INVALID_TRANSITION');
    assert_(['RESOLVED','DUPLICATE','TEST_ENDED'].indexOf(d.reason)>=0,'INVALID_REASON');
    r.status='CLOSED'; r.close_reason=d.reason; cancelJobs_(r,null,'CLOSED');
  } else if(t==='contact.stop') {
    r.stopped=true; cancelJobs_(r,null,'CONTACT_STOP');
  } else fail_('UNKNOWN_EVENT');
  audit_(r,t,now,role); return r;
}
