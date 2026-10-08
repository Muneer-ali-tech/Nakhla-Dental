function render_(r,j,c) {
  var intro='هذه رسالة اختبار ببيانات وهمية، وليست حجزًا حقيقيًا.\n';
  var greet='مرحباً '+r.name+'،\n';
  var ref='\nالمرجع التجريبي: '+r.reference,body,title;
  if(j.kind==='RECEIPT') {
    if(r.status==='INCOMPLETE') {
      title='تأكيد استلام فوري لبياناتك';
      body=greet+'تم استلام بياناتك بنجاح (الاسم، البريد الإلكتروني، رقم الجوال) وحفظها لدينا.\n'+
        'لم يكتمل طلب الحجز بعد — يمكنك إكمال الخطوات المتبقية في نموذج الحجز في أي وقت،\n'+
        'وسنرسل لك رسالة تذكير واحدة بعد 3 دقائق إن لم تُكمل الحجز الآن.';
    } else {
      title='تم استقبال طلب حجزك';
      body=greet+'تم استقبال طلب حجزك بنجاح.\n'+
        'سيقوم فريق الإدارة بمراجعة الطلب وتأكيد موعدك قريباً، وستصلك رسالة بالموعد المعتمد.\n'+
        'شكراً لثقتك بعيادات نخلة.';
    }
  } else if(j.kind==='FOLLOWUP') {
    title='تذكير ودّي: أكمل طلب الحجز';
    body=greet+'لاحظنا أنك بدأت خطوات الحجز ولم تُكملها بعد.\n'+
      'بياناتك محفوظة لدينا، ويمكنك المتابعة من حيث توقفت دون إعادة إدخال أي بيانات.\n'+
      'إن واجهت أي صعوبة، رد على هذه الرسالة وسيساعدك مسؤول التجربة مباشرة.';
  } else if(j.kind==='CONFIRMATION' || j.kind==='REMINDER') {
    title=j.kind==='CONFIRMATION'?'تأكيد بواسطة الاستقبال التجريبي':'تذكير بموعد تجريبي';
    body='الوقت الذي اعتمده مسؤول التجربة: '+
      Utilities.formatDate(new Date(r.appointment_at),c.timezone,'yyyy-MM-dd HH:mm')+
      ' بتوقيت الرياض. هذا ليس تحققًا من توافر عيادة فعلية.';
  } else {
    title='تجربة دعوة محايدة للتقييم';
    body='بعد تسجيل الحضور، ندعو الجميع لمشاركة تجربتهم بصدق دون اشتراط تقييم إيجابي.'+
      '\nهذا اختبار للنص والإرسال فقط. لا تنشر تقييمًا وهميًا على Google.'+
      '\nقناة الملاحظات والشكوى متاحة للجميع بالرد على هذا البريد.';
  }
  if(c.fast && ['FOLLOWUP','REMINDER','REVIEW'].indexOf(j.kind)>=0)
    body+='\nتم تسريع موعد هذه الرسالة لأغراض العرض التجريبي.';
  body+='\nللتغيير أو الإلغاء أو إيقاف التواصل: رد على هذا البريد مع المرجع.'+
    '\nيتعامل مسؤول التجربة مع الرد ويسجل الإجراء يدويًا؛ لا يوجد تحليل آلي للردود.';
  return {subject:'[TEST] عيادات نخلة: '+title,body:intro+body+ref};
}
function quiet_(now) {
  var h=Number(Utilities.formatDate(new Date(now),'Asia/Riyadh','H')); return h<8 || h>=20;
}
function nextJob_(c,now) {
  var rows=all_(c),chosen=null;
  rows.forEach(function(x) {
    var dirty=false;
    x.state.jobs.forEach(function(j) {
      if(j.status==='SENDING') {
        j.status='UNKNOWN'; j.reason='INTERRUPTED_SEND_NO_AUTO_RETRY'; dirty=true;
      }
    });
    if(dirty) save_(c,x.row,x.state);
  });
  rows.forEach(function(x) {
    var r=x.state,dirty=false,suppressed=suppressed_(c,r.email);
    r.jobs.forEach(function(j) {
      if(j.status!=='PENDING') return;
      if(!eligible_(r,j,suppressed)) {
        j.status='CANCELLED'; j.reason='STATE_OR_CONSENT_CHANGED'; dirty=true;
      } else if(now>=Date.parse(j.expires_at)) {
        j.status='CANCELLED'; j.reason='EXPIRED'; dirty=true;
      } else if(Date.parse(j.due_at)<=now &&
          (!chosen || Date.parse(j.due_at)<Date.parse(chosen.job.due_at)))
        chosen={row:x.row,state:r,job:j};
    });
    if(dirty) save_(c,x.row,r);
  }); return chosen;
}
function processOne_() {
  return locked_(function() {
    var c=cfg_(),now=Date.now(),selected=nextJob_(c,now);
    if(c.paused) return 'PAUSED';
    if(!selected) return 'EMPTY';
    if(!c.fast && quiet_(now)) return 'QUIET_HOURS';
    var r=selected.state,j=selected.job;
    /* القائمة الفارغة تعني قبول أي بريد زائر */
    if (c.allowed.length) assert_(c.allowed.indexOf(r.email)>=0,'RECIPIENT_NOT_ALLOWED');
    var message=render_(r,j,c); j.preview=message.body;
    if(c.mode==='DRY_RUN') {
      j.status='SIMULATED'; j.reason='NO_EMAIL_SENT'; save_(c,selected.row,r);
      return 'PROCESSED';
    }
    if(MailApp.getRemainingDailyQuota()<1) {
      j.reason='QUOTA_WAIT'; save_(c,selected.row,r); return 'QUOTA_WAIT';
    }
    // Persist intent BEFORE MailApp. Ambiguous outcomes never auto-retry.
    j.status='SENDING'; j.attempts++; j.started_at=iso_(now); save_(c,selected.row,r);
    try{sendEmailAdapter_(r.email,message,c);}
    catch(err) {
      j.status='UNKNOWN'; j.reason='MAIL_CALL_UNCERTAIN'; save_(c,selected.row,r);
      return 'PROCESSED';
    }
    j.status='SENT'; j.reason='ACCEPTED_BY_MAILAPP_NOT_DELIVERY_PROOF';
    j.sent_at=iso_(Date.now()); save_(c,selected.row,r); return 'PROCESSED';
  });
}
function sendEmailAdapter_(to,message,c) {
  MailApp.sendEmail({to:to,subject:message.subject,body:message.body,
    name:'Nakhla Dental DEMO',replyTo:c.replyTo});
}
function runWorker() {
  try {
    var started=Date.now(),result;
    for(var i=0;i<3 && Date.now()-started<20000;i++) {
      result=processOne_(); if(result!=='PROCESSED') break;
    }
    props_().setProperty('LAST_WORKER_OK',iso_(Date.now()));
    props_().setProperty('LAST_WORKER_ERROR',''); refreshViews_(); return result;
  } catch(err) {
    props_().setProperty('LAST_WORKER_ERROR',err.publicCode||'WORKER_ERROR');
    throw new Error(err.publicCode||'WORKER_ERROR');
  }
}
