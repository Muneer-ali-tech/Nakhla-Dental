function book_(c) { return SpreadsheetApp.openById(c.sheetId); }
function tab_(c,name) {
  var s=book_(c).getSheetByName(name); assert_(s,'SETUP_REQUIRED'); return s;
}
function all_(c) {
  var s=tab_(c,'State'),n=s.getLastRow(); if(n<2) return [];
  assert_(n-1<=c.maxRecords,'DEMO_RECORD_LIMIT');
  var cells=s.getRange(2,1,n-1,2).getValues(),seen={};
  return cells.map(function(row,i) {
    var r; try{r=JSON.parse(row[1]);}catch(e){fail_('CORRUPT_STATE');}
    assert_(r && r.id===row[0] && r.schema===1 && Array.isArray(r.jobs) &&
      Array.isArray(r.events) && Array.isArray(r.audit) && r.consent,'CORRUPT_STATE');
    assert_(!seen[r.id],'CORRUPT_STATE'); seen[r.id]=true;
    return {row:i+2,state:r};
  });
}
function save_(c,row,r) {
  var s=JSON.stringify(r); assert_(s.length<=c.maxStateChars,'DEMO_STATE_LIMIT');
  tab_(c,'State').getRange(row,1,1,2).setValues([[r.id,s]]); SpreadsheetApp.flush();
}
function suppressed_(c,email) {
  var s=tab_(c,'Suppression'),n=s.getLastRow(); if(n<2) return false;
  var key=hash_(email);
  return s.getRange(2,1,n-1,1).getValues().some(function(r){return r[0]===key;});
}
function suppress_(c,email,now) {
  if(!suppressed_(c,email)) {
    tab_(c,'Suppression').appendRow([hash_(email),iso_(now),'CONTACT_STOP']);
    SpreadsheetApp.flush();
  }
}
function public_(r) {
  return {request_id:r.id,reference:r.reference,status:r.status,version:r.version,
    is_test:true,appointment_at:r.appointment_at,contact_stopped:r.stopped};
}
function applyEvent_(env,body,role,c,now) {
  keys_(body,['type','request_id','data']); id_(body.request_id); obj_(body.data);
  var allowed=role==='ingest'?['request.create','request.complete','request.get']:
    ['request.get','request.review','request.confirm','request.reschedule',
    'request.change_requested','request.replied','request.cancel','request.attended',
    'request.no_show','request.close','contact.stop'];
  assert_(allowed.indexOf(body.type)>=0,'FORBIDDEN_EVENT');
  var rows=all_(c),digest=hash_(env.body);
  var match=rows.filter(function(x){return x.state.id===body.request_id;})[0];
  if(body.type==='request.get') {
    keys_(body.data,[]); assert_(match,'NOT_FOUND');
    return {ok:true,data:public_(match.state)};
  }
  for(var i=0;i<rows.length;i++) {
    var prior=rows[i].state.events.filter(function(x){return x.id===env.event_id;})[0];
    if(prior) {
      assert_(prior.hash===digest && prior.role===role &&
        rows[i].state.id===body.request_id,'IDEMPOTENCY_CONFLICT');
      return {ok:true,duplicate:true,event_version:prior.version,data:public_(rows[i].state)};
    }
  }
  var r,row;
  if(body.type==='request.create') {
    assert_(!match,'REQUEST_EXISTS'); assert_(rows.length<c.maxRecords,'DEMO_RECORD_LIMIT');
    r=make_(body,now,c); assert_(!suppressed_(c,r.email),'CONTACT_SUPPRESSED');
    row=rows.length+2; audit_(r,body.type,now,role);
  } else {
    assert_(match,'NOT_FOUND'); r=transition_(match.state,body,role,now,c); row=match.row;
  }
  r.events.push({id:env.event_id,hash:digest,role:role,version:r.version,at:iso_(now)});
  // Persist global opt-out first. On partial failure, prefer blocking contact.
  if(body.type==='contact.stop') suppress_(c,r.email,now);
  save_(c,row,r);
  return {ok:true,duplicate:false,event_version:r.version,data:public_(r)};
}
function safeCell_(v) {
  var s=v==null?'':String(v); return /^[=+\-@\t\r]/.test(s)?"'"+s:s;
}
function writeView_(c,name,header,rows) {
  var s=tab_(c,name); s.clearContents(); var values=[header].concat(rows);
  s.getRange(1,1,values.length,header.length).setValues(values.map(function(r) {
    return r.map(safeCell_);
  })); s.setFrozenRows(1);
}
function refreshViews_() {
  var c=cfg_(); return locked_(function() {
    var records=all_(c),jobs=[],audits=[],ops=[],states={},counts={};
    var requests=records.map(function(x) {
      var r=x.state; states[r.status]=(states[r.status]||0)+1;
      r.jobs.forEach(function(j) {
        counts[j.status]=(counts[j.status]||0)+1;
        jobs.push([r.reference,j.id,j.kind,j.status,j.due_at,j.reason,
          j.sent_at||'',j.attempts,j.preview||'']);
        if(['UNKNOWN','FAILED'].indexOf(j.status)>=0)
          ops.push([r.reference,j.id,j.status,j.reason,'MANUAL_REVIEW']);
      });
      r.audit.forEach(function(a){audits.push([r.reference,a.at,a.type,a.role,a.version]);});
      if(['SUBMITTED','UNDER_REVIEW','CHANGE_REQUESTED'].indexOf(r.status)>=0)
        ops.push([r.reference,'',r.status,'RECEPTION_ACTION',r.owner]);
      return [r.id,r.reference,r.name,r.email,r.phone||'',r.status,r.version,
        r.appointment_at||'',r.owner,r.stopped,r.updated_at];
    });
    writeView_(c,'Requests',['request_id','reference','test_name','test_email','test_phone','status',
      'version','appointment_utc','owner','stopped','updated_utc'],requests);
    writeView_(c,'Outbox',['reference','job_id','kind','status','due_utc','reason',
      'sent_utc','attempts','preview'],jobs);
    writeView_(c,'Audit',['reference','time_utc','event','role','version'],audits);
    writeView_(c,'Ops',['reference','job_id','status','reason','action'],ops);
    var metrics=[['ALL_TEST_REQUESTS',records.length],['MODE',c.mode],['PAUSED',c.paused],
      ['FAST_CLOCK',c.fast],['LAST_WORKER_OK',props_().getProperty('LAST_WORKER_OK')||'NEVER'],
      ['LAST_WORKER_ERROR',props_().getProperty('LAST_WORKER_ERROR')||''],
      ['VIEW_GENERATED_UTC',iso_(Date.now())]];
    Object.keys(states).sort().forEach(function(k){metrics.push(['STATE_'+k,states[k]]);});
    Object.keys(counts).sort().forEach(function(k){metrics.push(['JOB_'+k,counts[k]]);});
    writeView_(c,'Dashboard',['metric','value'],metrics); return {records:records.length};
  });
}
