function json_(x) {
  return ContentService.createTextOutput(JSON.stringify(x))
    .setMimeType(ContentService.MimeType.JSON);
}
function doGet() {
  return json_({ok:true,service:'tabah-dent-demo',version:'1.0.0',message:'LIVENESS_ONLY'});
}
function verify_(raw,c,now) {
  assert_(typeof raw==='string' && raw.length<=16000,'BODY_TOO_LARGE');
  var e; try{e=JSON.parse(raw);}catch(_){fail_('INVALID_JSON');}
  keys_(e,['v','key_id','ts','event_id','body','signature']);
  assert_(e.v===1 && ['ingest','admin'].indexOf(e.key_id)>=0,'INVALID_ENVELOPE');
  id_(e.event_id);
  assert_(Number.isInteger(e.ts) && Math.abs(now-e.ts*1000)<=300000,'STALE_SIGNATURE');
  assert_(typeof e.body==='string' && e.body.length<=12000,'INVALID_BODY');
  assert_(/^[a-f0-9]{64}$/.test(e.signature||''),'BAD_SIGNATURE');
  var message=[e.v,e.key_id,e.ts,e.event_id,e.body].join('\n');
  var key=e.key_id==='admin'?c.adminSecret:c.ingestSecret;
  assert_(equal_(e.signature,mac_(message,key)),'BAD_SIGNATURE'); return e;
}
function doPost(e) {
  try {
    var c=cfg_(),now=Date.now();
    var env=verify_(e && e.postData && e.postData.contents,c,now),body;
    try{body=JSON.parse(env.body);}catch(_){fail_('INVALID_BODY_JSON');}
    var result=locked_(function(){return applyEvent_(env,body,env.key_id,c,now);});
    return json_(result);
  } catch(err) {
    var code=err.publicCode||'INTERNAL_RETRY_SAME_EVENT'; console.error('API:'+code);
    return json_({ok:false,error:{code:code,retryable:err.publicCode?!!err.retryable:true}});
  }
}
