(() => {
const $ = id => document.getElementById(id);
const DAY = 86400000;
const EPOCH = Date.UTC(2000,0,6,18,14);
const SYNODIC = 29.530588853;
let place = null, forecast = null, selectedDate = new Date().toISOString().slice(0,10);
const dateInput = $('astro-date');
dateInput.value = selectedDate;
dateInput.min = selectedDate;
dateInput.max = new Date(Date.now()+15*DAY).toISOString().slice(0,10);

function phaseInfo(dateString){
  const date = new Date(dateString+'T12:00:00Z');
  const age = ((date.getTime()-EPOCH)/DAY%SYNODIC+SYNODIC)%SYNODIC;
  const phase = age/SYNODIC;
  const illumination = Math.round((1-Math.cos(phase*Math.PI*2))*50);
  let name,icon;
  if(phase<.035||phase>=.965){name='New Moon';icon='🌑';}
  else if(phase<.215){name='Waxing Crescent';icon='🌒';}
  else if(phase<.285){name='First Quarter';icon='🌓';}
  else if(phase<.465){name='Waxing Gibbous';icon='🌔';}
  else if(phase<.535){name='Full Moon';icon='🌕';}
  else if(phase<.715){name='Waning Gibbous';icon='🌖';}
  else if(phase<.785){name='Last Quarter';icon='🌗';}
  else{name='Waning Crescent';icon='🌘';}
  return {age,phase,illumination,name,icon};
}
function phaseShadow(phase){
  // A CSS shadow overlay approximates the illuminated lunar hemisphere.
  const waxing = phase < .5;
  const amount = Math.abs(.5-phase)*2;
  const edge = Math.round(amount*100);
  if(phase<.035||phase>=.965)return 'rgba(8,9,14,.97)';
  if(phase<.5)return 'linear-gradient(90deg,rgba(8,9,14,.96) 0 '+(100-edge)+'%,transparent '+(100-edge)+'%)';
  return 'linear-gradient(90deg,transparent '+edge+'%,rgba(8,9,14,.96) '+edge+'%)';
}
function dateLabel(s){return new Date(s+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'});}
function fmtTime(s){if(!s)return '—';const d=new Date(s);return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}
function duration(seconds){const m=Math.round(Number(seconds||0)/60);return Math.floor(m/60)+'h '+(m%60)+'m';}
function safeText(id,value){$(id).textContent=value;}
function localDate(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function nextPhase(from, target){
  const p=phaseInfo(from).phase;
  let delta=(target-p+1)%1;
  if(delta<.002)delta=1;
  const days=delta*SYNODIC;
  const d=new Date(new Date(from+'T12:00:00Z').getTime()+days*DAY);
  return {date:d.toISOString().slice(0,10),days:Math.ceil(days)};
}
function renderMoon(){
  const m=phaseInfo(selectedDate);
  safeText('moon-date',dateLabel(selectedDate));
  safeText('moon-name',m.name);
  safeText('moon-summary',m.age.toFixed(1)+' days into its lunar cycle');
  safeText('moon-light',m.illumination+'%');
  safeText('moon-age',m.age.toFixed(1)+' days');
  const targets=[{p:0,n:'New Moon'},{p:.25,n:'First Quarter'},{p:.5,n:'Full Moon'},{p:.75,n:'Last Quarter'}].map(x=>({...nextPhase(selectedDate,x.p),name:x.n})).sort((a,b)=>a.days-b.days);
  safeText('moon-next',targets[0].name+' · '+targets[0].days+'d');
  $('moon-disc').style.setProperty('--moon-shadow',phaseShadow(m.phase));
  renderCalendar();
  renderEvents();
}
function renderCalendar(){
  const [y,mo]=selectedDate.split('-').map(Number), first=new Date(y,mo-1,1), count=new Date(y,mo,0).getDate();
  safeText('calendar-month',first.toLocaleDateString(undefined,{month:'long',year:'numeric'}));
  const el=$('moon-calendar');let out=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>'<div class="calendar-head">'+x+'</div>').join('');
  for(let i=0;i<first.getDay();i++)out+='<div class="calendar-day empty"></div>';
  for(let n=1;n<=count;n++){
    const d=localDate(new Date(y,mo-1,n)),m=phaseInfo(d);
    const classes=['calendar-day',d===selectedDate?'selected':'',d===localDate(new Date())?'today':''].filter(Boolean).join(' ');
    out+='<div class="'+classes+'" title="'+d+' · '+m.name+'"><span class="day-num">'+n+'</span><span class="phase-icon">'+m.icon+'</span><span class="illum">'+m.illumination+'%</span></div>';
  }
  el.innerHTML=out;
}
function renderEvents(){
  const targets=[{p:0,n:'New Moon',i:'🌑'},{p:.25,n:'First Quarter',i:'🌓'},{p:.5,n:'Full Moon',i:'🌕'},{p:.75,n:'Last Quarter',i:'🌗'}];
  $('phase-events').innerHTML=targets.map(x=>{const d=nextPhase(selectedDate,x.p);const when=new Date(d.date+'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short'});return '<article class="event-card"><span class="event-icon">'+x.i+'</span><small>'+x.n+'</small><b>'+when+'</b><p>In about '+d.days+' day'+(d.days===1?'':'s')+'</p></article>';}).join('');
}
function renderSun(day){
  const rise=day.sunrise, set=day.sunset;
  safeText('sunrise',fmtTime(rise));safeText('sunset',fmtTime(set));
  safeText('solar-noon',rise&&set?fmtTime(new Date((new Date(rise).getTime()+new Date(set).getTime())/2).toISOString()):'—');
  safeText('daylight',duration(day.daylight_duration));
  safeText('sunshine',duration(day.sunshine_duration));
  safeText('uv',day.uv_index_max==null?'—':Number(day.uv_index_max).toFixed(1));
  const now=new Date(),r=new Date(rise),s=new Date(set);
  let progress=now<=r?0:now>=s?1:(now-r)/(s-r);
  progress=Math.max(0,Math.min(1,progress));
  const x=35+530*progress,y=160-135*Math.sin(Math.PI*progress);
  $('sun-marker').setAttribute('cx',x);$('sun-marker').setAttribute('cy',y);
  $('sun-progress').setAttribute('stroke-dasharray',(progress*1.01)+' 1');
}
function renderSky(){
  const times=forecast.hourly.time, target=selectedDate;
  let indices=times.map((t,i)=>t.startsWith(target)?i:-1).filter(i=>i>=0);
  if(!indices.length){safeText('cloud-cover','—');safeText('view-score','—');safeText('visibility','—');return;}
  const evening=indices.filter(i=>Number(times[i].slice(11,13))>=20);
  const idx=(evening.length?evening:indices).reduce((best,i)=>forecast.hourly.cloud_cover[i]<forecast.hourly.cloud_cover[best]?i:best, (evening.length?evening:indices)[0]);
  const clouds=forecast.hourly.cloud_cover[idx],vis=forecast.hourly.visibility[idx];
  const moon=phaseInfo(target),score=Math.max(0,Math.min(100,Math.round((100-clouds)*.75+(100-moon.illumination)*.25)));
  safeText('cloud-cover',clouds+'%');
  safeText('cloud-note',clouds<25?'Relatively clear skies are forecast.':clouds<60?'Some cloud may interrupt the view.':'Cloud cover may make observing difficult.');
  safeText('view-score',score>=75?'Promising':score>=50?'Fair':'Challenging');
  safeText('view-note','Estimated outlook: '+score+'/100 · Moonlight '+moon.illumination+'%');
  safeText('visibility',vis==null?'—':(vis/1000).toFixed(1)+' km');
}
async function getJSON(url){const r=await fetch(url);if(!r.ok)throw new Error('Request failed');return r.json();}
async function load(p){
  place=p;safeText('astro-status','Loading sky data for '+p.name+'…');
  try{
    const q='latitude='+encodeURIComponent(p.lat)+'&longitude='+encodeURIComponent(p.lon)+'&timezone=auto&forecast_days=16&daily=sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max&hourly=cloud_cover,visibility';
    forecast=await getJSON('https://api.open-meteo.com/v1/forecast?'+q);
    safeText('astro-status',(p.name+(p.admin1?', '+p.admin1:'')+(p.country?', '+p.country:''))+' · '+forecast.timezone);
    updateDate();
  }catch(e){safeText('astro-status','Could not load sky data. Check your connection and try again.');}
}
function updateDate(){
  if(!forecast)return;
  selectedDate=dateInput.value;
  renderMoon();
  const i=forecast.daily.time.indexOf(selectedDate);
  if(i<0){safeText('sunrise','—');safeText('sunset','—');safeText('solar-noon','—');safeText('daylight','—');safeText('sunshine','—');safeText('uv','—');safeText('astro-status','That date is outside the available forecast.');return;}
  renderSun({sunrise:forecast.daily.sunrise[i],sunset:forecast.daily.sunset[i],daylight_duration:forecast.daily.daylight_duration[i],sunshine_duration:forecast.daily.sunshine_duration[i],uv_index_max:forecast.daily.uv_index_max[i]});
  renderSky();
}
async function searchPlace(q){
  const data=await getJSON('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(q)+'&count=1&language=en&format=json');
  if(!data.results?.length)throw new Error('No place found');
  const x=data.results[0];return {name:x.name,admin1:x.admin1,country:x.country,lat:x.latitude,lon:x.longitude};
}
$('astro-search').addEventListener('submit',async e=>{e.preventDefault();const q=$('astro-place').value.trim();if(!q)return;try{safeText('astro-status','Searching…');const p=await searchPlace(q);await load(p);}catch(err){safeText('astro-status','Place not found. Try another city or spelling.');}});
$('astro-location').addEventListener('click',()=>{
  if(!navigator.geolocation){safeText('astro-status','Location is not supported by this browser.');return;}
  safeText('astro-status','Waiting for location permission…');
  navigator.geolocation.getCurrentPosition(async pos=>{await load({name:'Your location',lat:pos.coords.latitude,lon:pos.coords.longitude});},err=>safeText('astro-status',err.code===1?'Location permission was denied. Search for a place instead.':'Could not determine your location. Try searching instead.'),{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
});
dateInput.addEventListener('change',()=>{if(forecast)updateDate();else{selectedDate=dateInput.value;renderMoon();}});
renderMoon();
safeText('astro-status','Choose a location to explore its sky.');
})();