(function(){
  var STORE="a2-done";
  var titles={1:"Present simple, there is/are, it's",2:"Present continuous, stative verbs",3:"Family and friends"};
  var dayNames=["Yak","Dush","Sesh","Chor","Pay","Juma","Shan"];
  var dayFull=["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"];
  var months=["yan","fev","mar","apr","may","iyun","iyul","avg","sen","okt","noy","dek"];

  // Tue 6 Oct 2026: Mon-Fri 1 unit, Sat 2 units, Sun test, then a final test day
  var days=[], unit=1;
  for(var d=new Date(2026,9,6);;d.setDate(d.getDate()+1)){
    var wd=d.getDay(), item={date:new Date(d),units:[],kind:"unit"};
    if(unit>42) item.kind="final";
    else if(wd===0) item.kind="test";
    else if(wd===6){item.units=[unit,unit+1].filter(function(x){return x<=42});unit+=item.units.length;}
    else {item.units=[unit];unit++;}
    days.push(item);
    if(item.kind==="final") break;
  }

  var done={};
  try{done=JSON.parse(localStorage.getItem(STORE)||"{}")||{};}catch(e){done={};}
  function persist(){try{localStorage.setItem(STORE,JSON.stringify(done));}catch(e){}}
  function key(dt){return dt.getFullYear()+"-"+(dt.getMonth()+1)+"-"+dt.getDate();}
  function label(it){
    if(it.kind==="test") return "Test";
    if(it.kind==="final") return "Yakuniy test";
    return "Unit "+it.units.join(" + ");
  }
  function note(it){
    if(it.kind==="test") return "Haftalik test + listening";
    if(it.kind==="final") return "Butun kitob bo'yicha";
    return it.units.length===1&&titles[it.units[0]]?titles[it.units[0]]:"";
  }
  var todayKey=key(new Date());

  var cal=document.getElementById("cal"), weeks=[], cur=null;
  days.forEach(function(it){
    var wd=(it.date.getDay()+6)%7;
    if(!cur||wd===0){cur=new Array(7).fill(null);weeks.push(cur);}
    cur[wd]=it;
  });
  weeks.forEach(function(w,i){
    var sec=document.createElement("div");sec.className="week";
    var us=[];w.forEach(function(it){if(it)us=us.concat(it.units)});
    var h=document.createElement("h3");
    h.textContent=(i+1)+"-hafta"+(us.length?" · Unit "+us[0]+(us.length>1?"–"+us[us.length-1]:""):" · yakuniy test");
    sec.appendChild(h);
    var grid=document.createElement("div");grid.className="days";
    w.forEach(function(it){
      var b=document.createElement("button");b.type="button";
      if(!it){b.className="day empty";b.tabIndex=-1;b.setAttribute("aria-hidden","true");grid.appendChild(b);return;}
      var k=key(it.date);b.setAttribute("data-k",k);
      b.className="day"+(it.kind!=="unit"?" sun":"")+(k===todayKey?" today":"");
      b.innerHTML='<span class="d"></span><span class="u"></span><span class="n"></span>';
      b.querySelector(".d").textContent=dayNames[it.date.getDay()]+" · "+it.date.getDate()+" "+months[it.date.getMonth()];
      b.querySelector(".u").textContent=label(it);
      b.querySelector(".n").textContent=note(it);
      b.addEventListener("click",function(){
        if(done[k]) delete done[k]; else done[k]=true;
        persist();paint();
      });
      grid.appendChild(b);
    });
    sec.appendChild(grid);cal.appendChild(sec);
  });

  function countUnits(){var n=0;days.forEach(function(it){if(done[key(it.date)])n+=it.units.length});return n;}
  function paint(){
    document.querySelectorAll(".day[data-k]").forEach(function(b){
      var on=!!done[b.getAttribute("data-k")];
      b.classList.toggle("done",on);b.setAttribute("aria-pressed",on?"true":"false");
    });
    var n=countUnits();
    document.getElementById("bar").style.width=(n/42*100)+"%";
    document.getElementById("ptext").textContent=n+" / 42 unit";
    paintToday();
  }
  function paintToday(){
    var el=document.getElementById("today"), t=null;
    days.forEach(function(it){if(key(it.date)===todayKey)t=it;});
    if(!t){el.hidden=true;return;}
    el.hidden=false;
    el.innerHTML='<span class="k"></span><b></b><span class="s"></span>';
    el.querySelector(".k").textContent="Bugun · "+dayFull[t.date.getDay()];
    el.querySelector("b").textContent=label(t)+(done[todayKey]?" ✓":"");
    el.querySelector(".s").textContent=(note(t)||"")+(done[todayKey]?" · Bajarildi, zo'r!":"");
  }
  paint();
  var todayBtn=document.querySelector('.day[data-k="'+todayKey+'"]');
  if(todayBtn&&todayBtn.scrollIntoView&&window.innerWidth<720) setTimeout(function(){todayBtn.scrollIntoView({block:"center"});},50);

  // backup
  var msg=document.getElementById("msg");
  function say(t){msg.textContent=t;}
  document.getElementById("export").addEventListener("click",function(){
    var code=btoa(JSON.stringify(done));
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(code).then(function(){say("Nusxa olindi. Boshqa qurilmada \"Tiklash\" ni bosib joylashtir.");},function(){prompt("Shu kodni nusxa ol:",code);});
    } else prompt("Shu kodni nusxa ol:",code);
  });
  document.getElementById("import").addEventListener("click",function(){
    var code=prompt("Nusxa kodini joylashtir:");
    if(!code) return;
    try{var obj=JSON.parse(atob(code.trim()));if(typeof obj!=="object"||!obj)throw 0;done=obj;persist();paint();say("Tiklandi.");}
    catch(e){say("Kod noto'g'ri.");}
  });
  document.getElementById("reset").addEventListener("click",function(){
    if(confirm("Hamma belgilar o'chadi. Rozimisan?")){done={};persist();paint();say("Tozalandi.");}
  });

  // PWA
  if("serviceWorker" in navigator){
    window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").catch(function(){});});
  }
  var deferred=null, installBtn=document.getElementById("install");
  window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();deferred=e;installBtn.hidden=false;});
  installBtn.addEventListener("click",function(){
    if(!deferred) return;
    deferred.prompt();
    deferred.userChoice.finally(function(){deferred=null;installBtn.hidden=true;});
  });
  window.addEventListener("appinstalled",function(){installBtn.hidden=true;});
})();
