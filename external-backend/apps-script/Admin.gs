function setupDemo() {
  var p=props_(),ss=SpreadsheetApp.getActiveSpreadsheet(); assert_(ss,'USE_BOUND_SCRIPT');
  var defaults={DEMO_MODE:'true',MAIL_MODE:'DRY_RUN',PAUSED:'true',DEMO_FAST:'true',
    SPREADSHEET_ID:ss.getId(),ALLOWED_EMAILS:'',REPLY_TO:'',INGEST_SECRET:'',ADMIN_SECRET:''};
  Object.keys(defaults).forEach(function(k) {
    if(p.getProperty(k)===null) p.setProperty(k,defaults[k]);
  });
  assert_(p.getProperty('SPREADSHEET_ID')===ss.getId(),'WRONG_BOUND_SHEET');
  ss.setSpreadsheetTimeZone('Asia/Riyadh');
  ['State','Suppression','Requests','Outbox','Audit','Ops','Dashboard'].forEach(function(n) {
    if(!ss.getSheetByName(n)) ss.insertSheet(n);
  });
  [['State',['request_id','state_json']],
    ['Suppression',['email_sha256','stopped_utc','reason']]].forEach(function(x) {
    var s=ss.getSheetByName(x[0]);
    if(s.getLastRow()===0) s.getRange(1,1,1,x[1].length).setValues([x[1]]);
  }); SpreadsheetApp.flush();
}
function preflight() {
  var c=cfg_(),ss=book_(c);
  assert_(ss.getSpreadsheetTimeZone()===c.timezone,'TIMEZONE_MISMATCH');
  assert_(Session.getScriptTimeZone()===c.timezone,'SCRIPT_TIMEZONE_MISMATCH');
  ['State','Suppression','Requests','Outbox','Audit','Ops','Dashboard'].forEach(function(s) {
    tab_(c,s);
  });
  assert_(tab_(c,'State').getRange(1,1,1,2).getValues()[0].join('|')===
    'request_id|state_json','INVALID_STATE_HEADER');
  var count=locked_(function(){return all_(c).length;});
  var info={configuration:'PASS',records:count,mode:c.mode,paused:c.paused,fast_clock:c.fast,
    quota:MailApp.getRemainingDailyQuota(),worker_triggers_for_current_user:
    ScriptApp.getProjectTriggers().filter(function(t) {
      return t.getHandlerFunction()==='runWorker';
    }).length,note:'Not a live deployment or email delivery test'};
  console.log(JSON.stringify(info)); return info;
}
function installWorker() {
  preflight(); var found=ScriptApp.getProjectTriggers().filter(function(t) {
    return t.getHandlerFunction()==='runWorker';
  });
  assert_(found.length<=1,'DUPLICATE_TRIGGERS_REMOVE_MANUALLY');
  if(!found.length) ScriptApp.newTrigger('runWorker').timeBased().everyMinutes(1).create();
}
function pauseAll() {
  return locked_(function(){props_().setProperty('PAUSED','true');});
}
function resumeAll() {
  var ui=SpreadsheetApp.getUi();
  if(ui.alert('تشغيل المعالجة التجريبية','قد يرسل EMAIL بريدًا إلى قائمة الاختبار. هل توافق؟',
    ui.ButtonSet.YES_NO)!==ui.Button.YES) return;
  preflight(); locked_(function(){props_().setProperty('PAUSED','false');});
}
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Nakhla DEMO')
    .addItem('فحص الإعدادات','preflight').addItem('تحديث الجداول','refreshViews_')
    .addItem('تسجيل إجراء استقبال','operatorAction').addItem('تشغيل دورة معالجة','runWorker')
    .addItem('إيقاف الإرسال','pauseAll').addItem('استئناف بعد التأكيد','resumeAll').addToUi();
}
function prompt_(title,help) {
  var ui=SpreadsheetApp.getUi(),r=ui.prompt(title,help,ui.ButtonSet.OK_CANCEL);
  return r.getSelectedButton()===ui.Button.OK?r.getResponseText().trim():null;
}
function operatorAction() {
  var id=prompt_('معرّف الطلب التجريبي','انسخ request_id من Requests');
  if(id===null) return; id_(id);
  var action=prompt_('الإجراء',
    'review, confirm, reschedule, change_requested, replied, cancel, attended, no_show, close, stop');
  if(action===null) return;
  assert_(['review','confirm','reschedule','change_requested','replied','cancel',
    'attended','no_show','close','stop'].indexOf(action)>=0,'UNKNOWN_EVENT');
  var d={},c=cfg_();
  if(action==='confirm' || action==='reschedule') {
    d.appointment_at=prompt_('وقت تجريبي مؤكد','ISO مع المنطقة: YYYY-MM-DDTHH:mm:ss+03:00');
    if(d.appointment_at===null) return;
  }
  if(action==='close') {
    d.reason=prompt_('سبب الإغلاق','RESOLVED أو DUPLICATE أو TEST_ENDED');
    if(d.reason===null) return;
  }
  var ui=SpreadsheetApp.getUi();
  if(ui.alert('اعتماد الإجراء',action+' / '+id,ui.ButtonSet.YES_NO)!==ui.Button.YES) return;
  var result=locked_(function() {
    var record=all_(c).filter(function(x){return x.state.id===id;})[0];
    assert_(record,'NOT_FOUND'); d.expected_version=record.state.version;
    var body={type:action==='stop'?'contact.stop':'request.'+action,request_id:id,data:d};
    var env={event_id:'op-'+Utilities.getUuid(),body:JSON.stringify(body)};
    return applyEvent_(env,body,'admin',c,Date.now());
  }); refreshViews_(); ui.alert(JSON.stringify(result));
}
