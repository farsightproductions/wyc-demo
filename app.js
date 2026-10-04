/* Typhoon 1.0 — Blueception Web Design, 2004/2005.
   A static reconstruction: all people and content are fictional.
   PHP/database operations are represented by browser-local demonstration state.
   Historical function names and relevant comments are deliberately retained. */
(function () {
  'use strict';
  const seed = window.WYF_SEED;
  const key = 'wyf.typhoon.demo.v1:' + location.pathname;
  const copy = value => JSON.parse(JSON.stringify(value));
  let db = copy(seed), currentUser = null, storageAvailable = true, flash = null;
  const $main = document.getElementById('main');
  let route;

  function validDatabase(value) {
    return value && value.version === 1 && ['users','forums','topics','posts','news','files','censor'].every(k => Array.isArray(value[k])) &&
      value.pages && typeof value.pages === 'object' && Number.isFinite(value.nextId) && Number.isFinite(value.localTick);
  }
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const state = JSON.parse(stored);
      if (!validDatabase(state.db)) throw new Error('Older or incomplete demo data');
      db = state.db;
      currentUser = state.currentUser;
    }
    const probe = key + '.probe'; localStorage.setItem(probe,'1'); localStorage.removeItem(probe);
  } catch (_) {
    db = copy(seed); currentUser = null; storageAvailable = false;
    flash = {type:'error',text:'Saved demonstration data could not be opened. You can still use the site; changes will last for this visit only.'};
  }

  function save() {
    if (!storageAvailable) return;
    try { localStorage.setItem(key,JSON.stringify({db,currentUser})); }
    catch (_) { storageAvailable = false; flash = {type:'error',text:'Your browser could not save these changes. They still work for this visit, but may be lost when you leave.'}; }
  }
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url = (page,extra={}) => '?' + new URLSearchParams({page,...extra}).toString();
  const asset = name => 'assets/' + encodeURIComponent(name);
  const image = (name,alt,extra='') => `<img src="${asset(name)}" alt="${esc(alt)}" ${extra}>`;
  const imgLink = (name,alt,page,extra={},attrs='') => `<a href="${url(page,extra)}" ${attrs}>${image(name,alt)}</a>`;
  const byId = (collection,id) => collection.find(x => x.id === Number(id));
  const user = () => db.users.find(x => x.username === currentUser && !x.banned) || null;
  const admin = () => user()?.authority === 4;
  const member = () => !!user();
  const canModerate = forumId => admin() || (member() && byId(db.forums,forumId)?.moderator === currentUser && user().authority >= 3);
  const canEdit = post => member() && (post.author === currentUser || canModerate(post.forumId));
  const rank = authority => ({2:'FORUM USER',3:'MODERATOR',4:'ADMINISTRATOR'}[authority] || 'FORMER MEMBER');
  const postsFor = topicId => db.posts.filter(p => p.topicId === Number(topicId)).sort((a,b) => a.time.localeCompare(b.time) || a.id-b.id);
  const topicsFor = forumId => db.topics.filter(t => t.forumId === Number(forumId));
  const newsSorted = () => [...db.news].sort((a,b) => b.time.localeCompare(a.time) || b.id-a.id);
  const nextId = () => db.nextId++;
  function now() {
    // A local post belongs to the fictional 2005 timeline, not the real calendar.
    const d = new Date(seed.demoDate+'Z'); d.setUTCMinutes(d.getUTCMinutes()+db.localTick++);
    return d.toISOString().slice(0,19);
  }
  function stamp(value) {
    const d = new Date(value+'Z');
    if (Number.isNaN(d.valueOf())) return '';
    const day=d.getUTCDate(), suffix=(day%100>=11 && day%100<=13)?'th':({1:'st',2:'nd',3:'rd'}[day%10]||'th');
    const weekday=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getUTCDay()];
    const month=['January','February','March','April','May','June','July','August','September','October','November','December'][d.getUTCMonth()];
    const hh=String(d.getUTCHours()%12||12).padStart(2,'0');
    return `${weekday} ${day}${suffix} of ${month} ${d.getUTCFullYear()} ${hh}:${String(d.getUTCMinutes()).padStart(2,'0')}:${String(d.getUTCSeconds()).padStart(2,'0')} ${d.getUTCHours()>=12?'PM':'AM'}`;
  }
  function shortDate(value) {
    const d = new Date(value+'Z');
    return Number.isNaN(d.valueOf()) ? '' : new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(d);
  }
  function safeLink(value) {
    if (typeof value !== 'string' || /[\u0000-\u0020\\]/.test(value)) return null;
    if (value.startsWith('?') || value.startsWith('#')) return value;
    if (/^(?:files|assets)\/[a-zA-Z0-9%_.()-]+$/.test(value) && !value.includes('..')) return value;
    return null;
  }
  /* The former wordswrap helper split HTML around links before wrapping:
     // create array by deviding at each occurrence of "<a"
     // break up long words in $arr[0] since
     // it will never contain a hyberlink
     // run loop to devide remaining elements
     The original spelling is retained here. DOM parsing and CSS overflow-wrap
     now do that work without splitting link markup or inserting spaces. */
  function rich(value) {
    // Historical editors inserted HTML. Preserve a small safe formatting subset.
    // Never execute pasted markup or fetch somebody else's remote image.
    const input=document.createElement('template'); input.innerHTML=String(value||'');
    const output=document.createElement('div');
    const allowed=new Set(['B','STRONG','I','EM','U','BR','P','UL','OL','LI','H2','H3','SECTION','A']);
    function visit(node,parent) {
      if (node.nodeType===3) { parent.append(document.createTextNode(node.textContent)); return; }
      if (node.nodeType!==1 || ['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','FORM','INPUT'].includes(node.tagName)) return;
      if (node.tagName==='IMG') {
        const src=safeLink(node.getAttribute('src'));
        if (src && src.startsWith('assets/')) { const img=document.createElement('img'); img.src=src; img.alt=node.getAttribute('alt')||'Demo image'; img.style.maxWidth='100%'; parent.append(img); }
        return;
      }
      const target=allowed.has(node.tagName)?document.createElement(node.tagName.toLowerCase()):document.createDocumentFragment();
      if(node.tagName==='A') { const href=safeLink(node.getAttribute('href')); if(href) target.setAttribute('href',href); }
      for(const child of node.childNodes) visit(child,target);
      parent.append(target);
    }
    for (const child of input.content.childNodes) visit(child,output);
    return output.innerHTML;
  }
  function censor(message) {
    //Open the file that contains the words — now a browser-local demonstration list.
    for(const word of db.censor) if(String(word).trim()) message=message.split(String(word).trim()).join('*****'); //replace words
    return message; //return censored words
  }
  function shorten(value,len=45) {
    return value.length>len ? value.slice(0,len-3).replace(/\s+\S*$/,'')+'...' : value;
  }
  function forumbuttons(bg='light') {
    const suffix=bg==='light'?'f2':'';
    return `<div class="account-bar ${bg}">${user()?`<span class="account-name">${esc(currentUser)}</span><a href="${url('news')}" data-action="logout">${image('logout'+suffix+'.jpg','Logout')}</a>`:imgLink('register'+suffix+'.jpg','Register','register')}${imgLink('admin'+suffix+'.jpg','Administration','admin')}</div>`;
  }
  function leftMenu() {
    // fwtable fwsrc="140 (sidebar)fini1.jpg" fwstyle="Dreamweaver" fwdocid="742308039" fwnested="0"
    const entries=[['News','news','r2_c1','_f2'],['About WYF','about','r4_c1','_f3'],['Events','events','r6_c1','_f4'],['Discussion','forums','r8_c1','_f5'],['Links','links','r10_c1','_f6'],['Contact Us','contact','r12_c1','_f7']];
    document.getElementById('left-menu').innerHTML=image('140(sidebar)fini1_r1_c1.gif','Menu','class="left-menu-heading"')+'<div class="left-menu-grid"><div class="left-menu-buttons">'+entries.map(([label,page,part,hover],i)=>{
      const ext=page==='about'?'.svg':'.gif',stem='140(sidebar)fini1_'+part;
      return `<a href="${url(page)}"${route.page===page?' aria-current="page"':''}>${image(stem+ext,label,`width="100" height="18" data-hover="${asset(stem+hover+ext)}"`)}</a>`+(i<5?image('140(sidebar)fini1_r3_c1.gif','','class="menu-divider"'): '');
    }).join('')+image('140(sidebar)fini1_r13_c1.svg','','class="left-menu-bottom"')+'</div>'+image('140(sidebar)fini1_r2_c2.gif','','class="left-menu-edge"')+'</div>';
  }
  function orangebar() {
    // fwtable fwsrc="Untitled" fwbase="Rollbar.gif" fwstyle="Dreamweaver" fwdocid="742308039" fwnested="0"
    const entries=[['News','news'],['Forums','forums'],['Events','events'],['Information','about'],['Contact Us','contact']];
    return '<nav class="right-menu" aria-label="Graphical menu"><div class="orangebar">'+entries.map(([label,page],i)=>{
      const base=label.toLowerCase().replace(/ /g,'');
      return `<a href="${url(page)}">${image(base+'gold.svg',label,`data-hover="${asset(base+'blue.svg')}" width="113" height="72"`)}</a>`+(i<4?'<div class="right-divider"></div>':'');
    }).join('')+'</div></nav>';
  }
  function tabs(active='') {
    return `<nav class="tabs" aria-label="News and administration">${active==='news'?`<span aria-current="page">${image('tab1.gif','Latest News')}</span>`:imgLink('latestnews2.gif','Latest News','news')}${active==='oldnews'?`<span aria-current="page">${image('oldernews2.gif','Older News')}</span>`:imgLink('tab2.gif','Older News','oldnews')}${active==='admin'?`<span class="admin-tab" aria-current="page">${image('tabadmindark.jpg','Administration')}</span>`:imgLink('tabadmingrey.gif','Administration','admin',{},'class="admin-tab"')}</nav>`;
  }
  function loginbox() {
    if(member()) return '';
    return `<div class="login-area"><form data-form="login"><table class="loginbox"><tbody><tr><td><label for="login-name">Username:</label><input id="login-name" name="username" maxlength="18" autocomplete="off" required></td></tr><tr class="password-row"><td><label for="login-pass">Password:</label><input id="login-pass" type="password" name="demo-password" autocomplete="off" placeholder="Any made-up password"></td></tr><tr class="submit-row"><td><button type="submit">Login</button></td></tr><tr><td class="login-help">Demo: use <b>pixelpete</b>. Passwords are discarded.<br>Or <a href="${url('register')}">make a local screen name</a>.</td></tr></tbody></table></form></div>`;
  }
  function titlebar(title,long=false) { return `<h1 class="titlebar${long?' long':''}">${esc(title)}</h1>`; }
  function wide(title,body,active='') { return tabs(active)+forumbuttons('dark')+`<div class="wide-frame">${titlebar(title,true)}<div class="frame-body">${body}</div></div>`; }
  function headlines(items) {
    if(!items.length) return '<p class="local-note">There are no news articles in this section.</p>';
    return '<div class="headline-list">'+items.map(n=>`<a class="headline" href="${url('news',{ID:n.id})}" title="${esc(n.headline)}"><span class="headline-orb" aria-hidden="true"></span><span class="headline-title"><span>${esc(shorten(n.headline))}</span></span></a>`).join('')+'</div>';
  }
  function articleLayout(content,home=false,active='news') {
    return tabs(active)+forumbuttons('dark')+`<div class="article-layout${home?' home-layout':''}"><div class="reading-panel">${content}${loginbox()}</div>${orangebar()}</div>`;
  }
  function newsView() {
    const latest=newsSorted();
    if(route.ID) {
      const item=byId(db.news,route.ID); if(!item) return missing('That news article is no longer available.');
      return articleLayout(titlebar(item.headline)+`<div class="text">${rich(item.body)}</div>`+titlebar('Other News Articles')+headlines(latest.slice(0,6).filter(n=>n.id!==item.id)));
    }
    const welcome=db.pages.title;
    return articleLayout(`<div class="text welcome">${rich(welcome.body)}${admin()?`<p><a href="${url('editpage',{section:'title'})}">Admin - edit this section</a></p>`:''}</div>${image('latestnewsbar.gif','Latest News','class="latest-label"')}${headlines(latest.slice(0,5))}<div class="bottom-stripe"></div>`,true);
  }
  function pageView(page) {
    if(!Object.hasOwn(db.pages,page)) return missing();
    const item=db.pages[page];
    return articleLayout(titlebar(item.title)+`<div class="text">${rich(item.body)}${admin()?`<p><a href="${url('editpage',{section:page})}">ADMIN - Edit This Page</a></p>`:''}</div>`+titlebar('Latest News')+headlines(newsSorted().slice(0,5)),false,'');
  }
  function forumsView() {
    const rows=[...db.forums].sort((a,b)=>b.id-a.id).map(f=>{
      const topics=topicsFor(f.id),latest=[...topics].sort((a,b)=>b.time.localeCompare(a.time))[0];
      return `<tr><td class="topic-cell"><a href="${url('forum',{forum_id:f.id})}">${esc(f.name)}</a><br>Moderator: ${esc(f.moderator)}</td><td class="count">${topics.length}</td><td class="meta">${latest?`<a href="${url('topic',{topic_id:latest.id,pagenum:1})}">${esc(latest.title)}</a><br>Topic created by: <span class="status">${esc(latest.author)}</span>`:'No Topics Returned'}</td></tr>`;
    }).join('');
    return forumbuttons()+`<div class="wide-content"><table class="board-table"><caption>WESTBRIDGE YOUTH FORUM</caption><thead><tr><th>MESSAGE BOARD</th><th>TOPICS</th><th>LATEST TOPIC</th></tr></thead><tbody>${rows||'<tr><td class="topic-cell" colspan="3">No forums have been added.</td></tr>'}</tbody></table>${admin()?`<form class="forum-form" data-form="add-forum"><h2>ADMINISTRATION</h2><div class="form-body"><label for="new-forum">Add Forum</label> <input id="new-forum" name="name" type="text" maxlength="100" required><button>Add Forum</button><button type="reset">Clear Form</button></div></form>`:''}${loginbox()}</div>`;
  }
  function forumView() {
    const forum=byId(db.forums,route.forum_id); if(!forum) return missing('That forum is no longer available.');
    const topics=topicsFor(forum.id).sort((a,b)=>Number(b.announcement)-Number(a.announcement)||Number(b.sticky)-Number(a.sticky)||b.time.localeCompare(a.time)||b.id-a.id);
    const rows=topics.map(t=>{
      const count=postsFor(t.id).length, pages=Math.ceil(count/10);
      // REPLIES historically counted the opening post too. Preserve that harmless quirk.
      return `<tr><td class="topic-cell">${t.announcement?'<b>Announcement:</b> ':t.sticky?'<b>Sticky:</b> ':''}<a href="${url('topic',{topic_id:t.id,pagenum:1})}">${esc(t.title)}</a>${pages>1?' &nbsp; Page: '+Array.from({length:pages-1},(_,i)=>`<a href="${url('topic',{topic_id:t.id,pagenum:i+2})}">${i+2}</a>`).join(' '):''}<br>Poster: ${esc(t.author)}</td><td class="count">${count}</td><td class="meta">${esc(stamp(t.time))}<br><span class="status">${[t.announcement?'Announcement':'',t.sticky?'Sticky':'',t.locked?'Locked':''].filter(Boolean).join(', ')}</span></td></tr>`;
    }).join('');
    let form='';
    if(member()) form=`<form data-form="add-topic" data-id="${forum.id}" class="forum-form"><h2>NEW TOPIC</h2><div class="form-body"><label for="topic-name">Topic Name</label><br><input id="topic-name" name="title" type="text" maxlength="50" required>${canModerate(forum.id)?'<label><input type="checkbox" name="sticky"> Sticky Post</label>':''}${admin()?'<label><input type="checkbox" name="announcement"> Announcement</label>':''}<label class="sr-only" for="topic-body">First post</label><textarea name="body" id="topic-body" rows="20" maxlength="10000" required></textarea><button>Add Topic</button> <button type="reset">Clear Form</button><p class="form-hint">Your topic is saved only in this browser, within the fictional 2005 timeline.</p></div></form>`;
    else form='<p>You must be logged in to post</p>';
    return forumbuttons()+`<div class="wide-content"><table class="board-table"><caption>${esc(forum.name)}</caption><thead><tr><th>TOPIC</th><th>REPLIES</th><th>TOPIC INFORMATION</th></tr></thead><tbody>${rows||'<tr><td class="topic-cell" colspan="3">No topics yet.</td></tr>'}</tbody></table>${form}${admin()?`<div class="forum-admin"><h2>ADMINISTRATION</h2><div class="admin-actions"><button data-action="delete-forum" data-id="${forum.id}">Delete This Forum</button></div></div>`:''}<p class="forum-return"><a href="${url('forums')}">Return to Forum Menu</a></p>${loginbox()}</div>`;
  }
  function pagination(topicId,page,pages) {
    return `<nav class="pagination" aria-label="Topic pages">${page>1?imgLink('lstpage.jpg','Previous page','topic',{topic_id:topicId,pagenum:page-1}):'<span></span>'}<span class="page-links">${Array.from({length:pages},(_,i)=>i+1===page?`<b aria-current="page">${i+1}</b>`:`<a href="${url('topic',{topic_id:topicId,pagenum:i+1})}">${i+1}</a>`).join(' · ')}</span>${page<pages?imgLink('nxtpage.jpg','Next page','topic',{topic_id:topicId,pagenum:page+1}):'<span></span>'}</nav>`;
  }
  function topicView() {
    const topic=byId(db.topics,route.topic_id); if(!topic) return missing('That topic is no longer available.');
    const all=postsFor(topic.id),pages=Math.max(1,Math.ceil(all.length/10));
    const page=Math.max(1,Math.min(pages,Math.floor(Number(route.pagenum)||1)));
    const posts=all.slice((page-1)*10,page*10);
    const content=posts.map((p,i)=>{
      const author=db.users.find(u=>u.username===p.author);
      return `<table class="post"><tbody><tr><td class="rank">${rank(author?.authority)}</td><td class="post-subject">${(page-1)*10+i?'Re: ':''}${esc(topic.title)}</td></tr><tr><td class="author" rowspan="2">${author?`<a href="${url('profile',{ID:author.id})}">${esc(p.author)}</a>`:`<b>${esc(p.author)}</b>`}${image('AVATAR.svg','WYF member avatar')}<span class="secondary-status">${esc(author?.secondary||'User Deleted')}</span></td><td class="message"><div class="post-rich">${rich(p.body)}</div></td></tr><tr><td class="post-footer">Posted: ${esc(stamp(p.time))}<span class="post-actions">${canEdit(p)?imgLink('EDIT.jpg','Edit post','editpost',{post_id:p.id,pagenum:page}):''}${canModerate(topic.forumId)?`<button class="image-action" data-action="delete-post" data-id="${p.id}">${image('DELETE.jpg','Delete post')}</button>`:''}</span></td></tr></tbody></table>`;
    }).join('');
    // MODERATOR STUFF TO DO
    const controls=canModerate(topic.forumId)?`<div class="forum-admin"><h2>ADMINISTRATION</h2><div class="admin-actions"><button data-action="toggle-lock" data-id="${topic.id}">${topic.locked?'Unlock':'Lock'} This Topic</button><button data-action="toggle-sticky" data-id="${topic.id}">${topic.sticky?'Un-sticky':'Sticky'} This Topic</button><button data-action="delete-topic" data-id="${topic.id}">Delete This Topic</button></div></div>`:'';
    let reply=topic.locked?'<p>This thread has been locked by a moderator</p>':'<p>You must be logged in to post</p>';
    if(!topic.locked && member()) reply=`<form data-form="reply" data-id="${topic.id}" class="forum-form"><h2>REPLY TO TOPIC</h2><div class="form-body"><label class="sr-only" for="reply-body">Your reply</label><textarea id="reply-body" name="body" rows="20" maxlength="10000" required></textarea><button>Reply</button> <button type="reset">Clear Form</button><p class="form-hint">Your reply stays in this browser. No message is sent to anyone.</p></div></form>`;
    return forumbuttons()+`<div class="wide-content"><h1 class="topic-heading">${esc(topic.title)}</h1><div class="topic-status">${[topic.sticky?'Sticky':'',topic.locked?'Locked':'',topic.announcement?'Announcement':''].filter(Boolean).join(' ')}</div><div class="page-status">Page Number: ${page}</div>${content||'<p>This topic has no posts.</p>'}${pagination(topic.id,page,pages)}${controls}${reply}<p class="forum-return"><a href="${url('forum',{forum_id:topic.forumId})}">Return to Topics Menu</a></p>${loginbox()}</div>`;
  }
  function registerView() {
    return wide('REGISTER',`<p class="local-note">Make a fictional screen name for this browser only. Use a made-up password and an example.org email address. The password is neither checked nor stored.</p><form data-form="register"><table class="profile-table"><caption>New User Registration</caption><tbody><tr><th><label for="reg-name">Username</label></th><td><input id="reg-name" name="username" maxlength="18" pattern="[A-Za-z][A-Za-z0-9_]{1,17}" autocomplete="off" required></td></tr><tr><th><label for="reg-password">Password</label></th><td><input type="password" id="reg-password" name="demo-password" autocomplete="off" placeholder="Make something up"></td></tr><tr><th><label for="reg-email">Email Address</label></th><td><input type="email" id="reg-email" name="email" value="new-member@example.org" required></td></tr></tbody></table><p style="text-align:center"><button>Register</button></p></form>${member()?'<p class="local-note">Registering switches you to the new local identity.</p>':''}`);
  }
  function roleChooser() {
    return `<fieldset class="role-chooser"><legend>Demonstration access</legend><p>Try the original controls as a member, moderator or administrator. This changes only your local copy; it is not authentication.</p><form data-form="role"><label for="demo-role">View as </label><select id="demo-role" name="username"><option value="">Guest</option>${['pixelpete','skylark','amberwire'].map(name=>{const u=db.users.find(x=>x.username===name);return u&&!u.banned?`<option value="${name}"${name===currentUser?' selected':''}>${esc(name)} — ${rank(u.authority).toLowerCase()}</option>`:'';}).join('')}</select> <button>Switch identity</button></form></fieldset>`;
  }
  function adminView() {
    const items=admin()?[['newsDAMINISTRATOION.jpg','News Administration','nadmin'],['FORUMDAMINISTRATOION.jpg','Forum Administration','forums'],['USERDAMINISTRATOION.jpg','User Administration','uadmin'],['censoradmin.gif','Censor Information','cadmin'],['fileman.gif','File Administration','fadmin']]:[];
    if(member()) items.push(['personal.jpg','Personal Information','padmin']);
    return wide('ADMINISTRATION PANEL',`<p>Welcome to the administration panel!</p><p>${member()?'You are currently logged in as '+esc(currentUser):'As a guest, you cannot access the administration panel. Please register or try a demonstration identity below.'}</p>${roleChooser()}${titlebar('What do you want to change today?',true)}<nav class="admin-menu" aria-label="Administration">${items.map(([img,label,page])=>imgLink(img,label,page)).join('')}</nav><p class="local-note">All changes apply to this browser only. <a href="${url('demo')}">Reset the demonstration</a> to restore the original fictional content.</p>`,'admin');
  }
  function profileView() {
    const u=byId(db.users,route.ID); if(!u) return missing('That member profile is no longer available.');
    return wide('MEMBER PROFILE',`<table class="profile-table"><tbody><tr><th>Username</th><td><b>${esc(u.username)}</b></td></tr><tr><th>Primary Status</th><td>${rank(u.authority)}</td></tr><tr><th>Secondary Status</th><td>${esc(u.secondary)}</td></tr><tr><th>Personal Statement</th><td>${esc(u.personal)}</td></tr><tr><th>Posts</th><td>${db.posts.filter(p=>p.author===u.username).length}</td></tr></tbody></table><p><a href="${url('forums')}">Return to Forum Menu</a></p>`);
  }
  function denied() { return wide('Demonstration access',`<p>Choose the appropriate demonstration identity to use these controls.</p>${roleChooser()}<p><a href="${url('admin')}">Return to Administration</a></p>`); }
  function userEditor(u,own=false) {
    const row=(label,value,field)=>`<tr><th>${label}</th><td>${esc(value)}</td><td class="edit-field">${field}</td></tr>`;
    return `<form data-form="${own?'personal':'edit-user'}" data-id="${u.id}"><table class="profile-table"><caption>${esc(u.username)}</caption><tbody>${row('Username',u.username,'')}${row('Password','***********','<input type="password" name="demo-password" aria-label="Demo password (discarded)" placeholder="Not saved" autocomplete="off">')}${row('Primary Status',rank(u.authority),own?'':`<select name="authority" aria-label="Primary status">${[2,3,4].map(n=>`<option value="${n}"${n===u.authority?' selected':''}>${rank(n)}</option>`).join('')}</select>`)}${row('Secondary Status',u.secondary,`<input name="secondary" aria-label="Secondary status" value="${esc(u.secondary)}" maxlength="25">`)}${row('Email',u.email,`<input name="email" type="email" aria-label="Fictional email address" value="${esc(u.email)}" required>`)}${row('Comments',u.comment,own?'':`<textarea name="comment" aria-label="Administrator comment" maxlength="1000">${esc(u.comment)}</textarea>`)}${row('Personal Statement',u.personal,`<textarea name="personal" aria-label="Personal statement" maxlength="1000">${esc(u.personal)}</textarea>`)}<tr><th>Posts</th><td>${db.posts.filter(p=>p.author===u.username).length}</td><td class="profile-submit"><button>UPDATE</button></td></tr></tbody></table></form><p class="local-note">Use fictional details and example.org addresses only. Password fields are decorative and are never saved.</p>`;
  }
  function userAdminView() {
    if(!admin()) return denied();
    let detail='';
    if(route.ID) {
      const u=byId(db.users,route.ID); if(!u) return missing('That user is no longer available.');
      detail=route.action==='edit'?userEditor(u):`<table class="profile-table"><tbody>${[['Username',u.username],['Primary Status',rank(u.authority)],['Secondary Status',u.secondary],['Email',u.email],['Comments',u.comment],['Personal Statement',u.personal],['Account status',u.banned?'Banned':'Active']].map(([k,v])=>`<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table><p>${imgLink('EDITUSER.jpg','Edit user','uadmin',{ID:u.id,action:'edit'})}</p>`;
    }
    const rows=[...db.users].sort((a,b)=>b.username.localeCompare(a.username)).map(u=>`<tr><td>${esc(u.username)}</td><td>${rank(u.authority)}</td><td>${db.posts.filter(p=>p.author===u.username).length}</td><td>${esc(u.comment)}</td><td class="actions">${imgLink('viewbutton2.jpg','View '+u.username,'uadmin',{ID:u.id,action:'view'})}${imgLink('editbutton2.jpg','Edit '+u.username,'uadmin',{ID:u.id,action:'edit'})}<button class="image-action" data-action="delete-user" data-id="${u.id}">${image('deletebutton.jpg','Delete '+u.username)}</button><button class="image-action" data-action="ban-user" data-id="${u.id}">${image(u.banned?'unbanbutton.jpg':'banbutton.jpg',(u.banned?'Unban ':'Ban ')+u.username)}</button></td></tr>`).join('');
    return wide('USER INFORMATION',detail+`<h2 class="titlebar long">USER ADMINISTRATION</h2><table class="data-table"><thead><tr><th>Username</th><th>Primary Status</th><th>Posts</th><th>Comment</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table><p><a href="${url('admin')}">Return to Administration</a></p>`);
  }
  function toolbar() {
    return `<div class="toolbar" aria-label="Formatting"><button type="button" data-action="format" data-tag="b" title="Bold"><b>B</b></button><button type="button" data-action="format" data-tag="i" title="Italic"><i>I</i></button><button type="button" data-action="format" data-tag="u" title="Underline"><u>U</u></button><button type="button" data-action="format" data-tag="a">Link</button><button type="button" data-action="format" data-tag="img">Image</button></div>`;
  }
  function newsAdminView() {
    if(!admin()) return denied();
    if(route.action==='add'||route.action==='edit') {
      const n=route.action==='edit'?byId(db.news,route.ID):null;
      if(route.action==='edit'&&!n) return missing('That article is no longer available.');
      return wide('News Administration',`<form class="simple-form" data-form="news" data-id="${n?.id||''}"><label for="news-headline">${n?'Edit':'Add'} News — headline</label><input type="text" id="news-headline" name="headline" value="${esc(n?.headline||'')}" maxlength="100" required><label for="editor-body">Article text</label><textarea id="editor-body" name="body" maxlength="20000" required>${esc(n?.body||'')}</textarea>${toolbar()}<button>${n?'Edit':'Submit'} News Item</button> <button type="reset">Clear Form</button><p class="local-note">Simple HTML formatting is supported. Changes stay in this browser.</p></form><p><a href="${url('nadmin')}">Return to Admin</a></p>`);
    }
    return wide('News Administration',`${imgLink('addnews.jpg','Add News','nadmin',{action:'add'})}<table class="data-table"><thead><tr><th>Article Title</th><th>Last Edited By</th><th>Article Date</th><th>Actions</th></tr></thead><tbody>${newsSorted().map(n=>`<tr><td>${esc(n.headline)}</td><td>${esc(n.author)}</td><td>${shortDate(n.time)}</td><td class="actions">${imgLink('viewbutton2.jpg','View article','news',{ID:n.id})}${imgLink('editbutton2.jpg','Edit article','nadmin',{ID:n.id,action:'edit'})}<button class="image-action" data-action="delete-news" data-id="${n.id}">${image('deletebutton.jpg','Delete article')}</button></td></tr>`).join('')}</tbody></table><p><a href="${url('admin')}">Return to Administration</a></p>`);
  }
  function editPageView() {
    if(!admin()) return denied();
    const section=route.section; if(!Object.hasOwn(db.pages,section)) return missing();
    return wide('Edit Page',`<form class="simple-form" data-form="page" data-section="${esc(section)}"><label for="editor-body">${esc(db.pages[section].title)}</label><textarea id="editor-body" name="body" maxlength="20000" required>${esc(db.pages[section].body)}</textarea>${toolbar()}<button>Change Page</button> <button type="reset">Clear Page</button></form><p><a href="${url(section==='title'?'news':section)}">Return to Page</a><br><a href="${url('news')}">Return to index</a></p><p class="local-note">Changes stay in this browser. Scripts, remote images and unsupported HTML are removed when content is displayed.</p>`);
  }
  function editPostView() {
    const p=byId(db.posts,route.post_id); if(!p) return missing('That post is no longer available.');
    if(!canEdit(p)) return denied();
    return wide('Edit Post',`<form class="simple-form" data-form="post" data-id="${p.id}"><label for="editor-body">Post text</label><textarea id="editor-body" name="body" maxlength="10000" required>${esc(p.body)}</textarea>${toolbar()}<button>Edit Post</button> <button type="reset">Clear Form</button></form><p><a href="${url('topic',{topic_id:p.topicId,pagenum:route.pagenum||1})}">Return to Post</a></p>`);
  }
  function censorView() {
    if(!admin()) return denied();
    return wide('Edit Bad words File',`<form class="simple-form" data-form="censor"><label for="censor-words">Please enter each badword on a separate line.</label><p class="local-note">This demonstration uses two mild sample words. Blank lines are ignored. Matches are literal and case-sensitive, and are replaced when new posts or edits are saved.</p><textarea id="censor-words" name="words" maxlength="2000">${esc(db.censor.join('\n'))}</textarea><button>Submit</button></form><p><a href="${url('admin')}">Return to Administration</a></p>`);
  }
  function fileAdminView() {
    if(!admin()) return denied();
    return wide('FILE ADMINISTRATION',`<p class="local-note">This is a local file cabinet, not an upload service. Small text files and PNG/JPEG/GIF pictures can be kept in this browser and previewed here. They are never sent anywhere.</p><table class="data-table"><thead><tr><th>Filename</th><th>Type</th><th>Link</th><th>Action</th></tr></thead><tbody>${db.files.map(f=>`<tr><td>${esc(f.name)}</td><td>${esc(f.type)}</td><td><a href="${f.seedPath?esc(f.seedPath):url('file',{ID:f.id})}">${f.seedPath?esc(f.seedPath):'Local preview'}</a></td><td class="actions"><button class="image-action" data-action="delete-file" data-id="${f.id}">${image('deletebutton.jpg','Remove '+f.name+' from list')}</button></td></tr>`).join('')}</tbody></table><form data-form="file"><label for="local-file">File Upload (local demonstration)</label><p><input type="file" id="local-file" name="file" accept=".txt,.png,.jpg,.jpeg,.gif" required></p><button>Add to local cabinet</button><p class="local-note">250 KB per file; 1 MB total local file data. Removing a supplied example hides its cabinet entry; it does not remove a file from the website.</p></form><p><a href="${url('admin')}">Return to Administration</a></p>`);
  }
  function localFileView() {
    const f=byId(db.files,route.ID); if(!f) return missing('That local file is no longer available.');
    let preview;
    if(f.seedPath) preview=`<a href="${esc(f.seedPath)}">Open supplied example</a>`;
    else if(f.type==='text/plain') preview='<pre>'+esc(f.content)+'</pre>';
    else if(/^data:image\/(png|jpeg|gif);base64,[A-Za-z0-9+/=]+$/.test(f.content||'')) preview=`<img src="${f.content}" alt="${esc(f.name)}">`;
    else preview='<p>This local file cannot be displayed.</p>';
    return wide(f.name,`<div class="file-preview">${preview}</div><p><a href="${url('fadmin')}">Return to File Administration</a></p>`);
  }
  function demoView() {
    return wide('About this demonstration',`<div class="plain-text"><p>This is a sanitised reconstruction of a mid-2000s PHP/MySQL website. <b>Westbridge Youth Forum is fictional.</b> All members, news, messages, events, venues and contact details in this demonstration have been invented.</p><p>The original development identity is preserved: Typhoon 1.0, Blueception Web Design and Farsight production material. <a href="${url('credits')}">Production credits</a>.</p><h2>Try the site</h2><p>Browse the news and information pages, or open a forum. You can register a fictional local member and post a topic or reply. The open-afternoon planning thread runs over two pages.</p>${roleChooser()}<h2>What is saved?</h2><p>Changes are stored only in this browser for this copy of the site. There is no server login, shared forum database, email delivery or remote file upload. Password fields are never saved or checked. Use invented details only.</p><p>New activity uses a fictional 14 October 2005 clock. ${storageAvailable?'Browser storage is available.':'Browser storage is unavailable; changes last for this visit only.'}</p><h2>Start again</h2><p>Reset removes local members, posts, edits and files, restores the supplied fictional content and returns you to Guest. It affects this demonstration only.</p><button data-action="reset">Reset demonstration</button></div>`);
  }
  function creditsView() {
    return wide('Production credits',`<div class="plain-text">${image('FarsightLogo.jpg','Farsight production logo','class="credit-logo"')}<p><b>Typhoon 1.0</b><br>Blueception Web Design<br>Original development: 2004–2005</p><p>The surviving production material also carries the names Farsight Productions, Farsight Media and Farsight Webdesign. The supplied Farsight logo is retained here as development provenance.</p><p>The earlier PHP/MySQL application has been reconstructed as a self-contained static demonstration. Generic original interface graphics remain in use, including their period button styles, tabs and sliced borders. Client-bearing artwork has been replaced with the fictional Westbridge identity.</p><p>The original client’s source archive, database and documentation are not part of this public site.</p><p><a href="${url('demo')}">About the demonstration</a> · <a href="README.md">README</a></p></div>`);
  }
  function missing(message='That page could not be found.') { return wide('Page unavailable',`<p>${esc(message)}</p><p><a href="${url('news')}">Return to the front page</a> or <a href="${url('forums')}">browse the forums</a>.</p>`); }
  function render(focus=false) {
    //grab data
    route=Object.fromEntries(new URLSearchParams(location.search));
    route.page=route.page||'news';
    if(!user()) currentUser=null;
    const views={news:newsView,oldnews:()=>articleLayout(titlebar('Older News Section')+headlines(newsSorted().slice(5)),false,'oldnews'),forums:forumsView,forum:forumView,topic:topicView,register:registerView,admin:adminView,profile:profileView,padmin:()=>member()?wide('PERSONAL PROFILE',userEditor(user(),true)):denied(),uadmin:userAdminView,nadmin:newsAdminView,editpage:editPageView,editpost:editPostView,cadmin:censorView,fadmin:fileAdminView,file:localFileView,demo:demoView,credits:creditsView};
    let body;
    if(Object.hasOwn(views,route.page)) body=views[route.page]();
    else if(Object.hasOwn(db.pages,route.page)) body=pageView(route.page);
    else body=missing();
    $main.innerHTML=(flash?`<div class="notice ${esc(flash.type)}" role="status">${esc(flash.text)}</div>`:'')+body;
    if(flash) document.getElementById('announcer').textContent=flash.text;
    flash=null;
    leftMenu();
    document.title=($main.querySelector('h1,caption')?.textContent.trim()||'Welcome')+' — Westbridge Youth Forum';
    MM_preloadImages();
    if(focus) { $main.focus({preventScroll:true}); window.scrollTo(0,0); }
  }
  function navigate(page,extra={}) { history.pushState(null,'',url(page,extra)); render(true); }
  function success(text,page=route.page,extra={}) { flash={type:'success',text}; save(); navigate(page,extra); }
  function fail(message,form) {
    if(form) {
      let box=form.querySelector('.form-error');
      if(!box) {box=document.createElement('div');box.className='notice error form-error';box.setAttribute('role','alert');form.prepend(box);}
      box.textContent=message; box.scrollIntoView({block:'nearest'});
    } else {flash={type:'error',text:message};render();}
    document.getElementById('announcer').textContent=message;
  }
  function requireMember() { if(!member()) throw new Error('Please choose or register a demonstration identity first.'); }
  function requireAdmin() { if(!admin()) throw new Error('Choose the administrator demonstration identity first.'); }
  function requireModerator(forumId) { if(!canModerate(forumId)) throw new Error('These controls belong to this board’s moderator or the administrator.'); }
  function requiredText(formData,name,max=10000) {
    const value=String(formData.get(name)||'').trim();
    if(!value) throw new Error('Please fill in all required fields.');
    if(value.length>max) throw new Error('That entry is too long.');
    return value;
  }
  function exampleEmail(value) {
    if(!/^[A-Za-z0-9._+-]+@(?:[A-Za-z0-9-]+\.)?example\.org$/i.test(value)) throw new Error('Please use an invented example.org email address for this demonstration.');
    return value;
  }
  function removeTopic(id) { db.posts=db.posts.filter(p=>p.topicId!==id); db.topics=db.topics.filter(t=>t.id!==id); }

  document.addEventListener('submit',async event=>{
    const form=event.target.closest('form[data-form]'); if(!form) return;
    event.preventDefault();
    const values=new FormData(form),kind=form.dataset.form;
    try {
      if(kind==='login') {
        const name=requiredText(values,'username',18);
        const u=db.users.find(x=>x.username.toLowerCase()===name.toLowerCase());
        if(!u) throw new Error('That local screen name was not found. Try pixelpete or register a new one.');
        if(u.banned) throw new Error('This demonstration account has been banned. Choose another identity or reset the demo.');
        currentUser=u.username; form.reset(); success('Logged in locally as '+currentUser+'.',route.page,Object.fromEntries(Object.entries(route).filter(([k])=>k!=='page')));
      } else if(kind==='role') {
        const u=db.users.find(x=>x.username===values.get('username')&&!x.banned);
        currentUser=u?.username||null; success('Now viewing as '+(currentUser||'Guest')+'.','admin');
      } else if(kind==='register') {
        const name=requiredText(values,'username',18);
        if(!/^[A-Za-z][A-Za-z0-9_]{1,17}$/.test(name)) throw new Error('Use 2–18 letters, numbers or underscores, beginning with a letter.');
        if(name.toLowerCase()==='guest'||db.users.some(x=>x.username.toLowerCase()===name.toLowerCase())) throw new Error('That username is taken, please try another.');
        const email=exampleEmail(requiredText(values,'email',80));
        db.users.push({id:nextId(),username:name,authority:2,secondary:'New member',email,personal:'',comment:'Local demonstration member',banned:false});
        currentUser=name;form.reset(); success('Your local member has been created. No real account was registered.','news');
      } else if(kind==='add-forum') {
        requireAdmin();db.forums.push({id:nextId(),name:requiredText(values,'name',100),moderator:currentUser});success('Forum added successfully.','forums');
      } else if(kind==='add-topic') {
        requireMember();const f=byId(db.forums,form.dataset.id);if(!f) throw new Error('That forum is no longer available.');
        const title=requiredText(values,'title',50),body=censor(requiredText(values,'body'));
        const id=nextId(),time=now();db.topics.push({id,forumId:f.id,title,author:currentUser,time,sticky:canModerate(f.id)&&values.has('sticky'),announcement:admin()&&values.has('announcement'),locked:false});
        db.posts.push({id:nextId(),topicId:id,forumId:f.id,author:currentUser,body,time});success('Topic insertion successful.','topic',{topic_id:id,pagenum:1});
      } else if(kind==='reply') {
        requireMember();const topic=byId(db.topics,form.dataset.id);if(!topic) throw new Error('That topic is no longer available.');
        if(topic.locked) throw new Error('This thread has been locked by a moderator.');
        // Bit for adding new post, needs to know topic title so is placed here
        const body=censor(requiredText(values,'body'));db.posts.push({id:nextId(),topicId:topic.id,forumId:topic.forumId,author:currentUser,body,time:now()});success('Posted successfully — in this browser only.','topic',{topic_id:topic.id,pagenum:Math.ceil(postsFor(topic.id).length/10)});
      } else if(kind==='post') {
        const p=byId(db.posts,form.dataset.id);if(!p||!canEdit(p)) throw new Error('You cannot edit this post with the current demo identity.');
        p.body=censor(requiredText(values,'body'));success('Updated Succesfully','topic',{topic_id:p.topicId,pagenum:route.pagenum||1});
      } else if(kind==='personal'||kind==='edit-user') {
        requireMember();if(kind==='edit-user') requireAdmin();
        const u=kind==='personal'?user():byId(db.users,form.dataset.id);if(!u) throw new Error('That member is no longer available.');
        const email=exampleEmail(requiredText(values,'email',80));
        const authority=kind==='personal'?u.authority:Number(values.get('authority'));
        if(![2,3,4].includes(authority)) throw new Error('Choose a valid primary status.');
        if(u.username===currentUser&&authority!==4&&u.authority===4) throw new Error('Keep the current administrator at this status, or switch identity before editing it.');
        Object.assign(u,{email,secondary:String(values.get('secondary')||'').slice(0,25),personal:String(values.get('personal')||'').slice(0,1000),authority});
        if(kind==='edit-user') u.comment=String(values.get('comment')||'').slice(0,1000);
        success('Personal information updated locally.',kind==='personal'?'padmin':'uadmin',kind==='personal'?{}:{ID:u.id,action:'edit'});
      } else if(kind==='news') {
        requireAdmin();const headline=requiredText(values,'headline',100),body=censor(requiredText(values,'body',20000));
        if(form.dataset.id) {const n=byId(db.news,form.dataset.id);if(!n) throw new Error('That article is no longer available.');Object.assign(n,{headline,body,author:currentUser});}
        else db.news.push({id:nextId(),headline,body,author:currentUser,time:now()});
        success('News saved locally.','nadmin');
      } else if(kind==='page') {
        requireAdmin();const section=form.dataset.section;if(!Object.hasOwn(db.pages,section)) throw new Error('That page is unavailable.');
        db.pages[section].body=censor(requiredText(values,'body',20000));success('Updated Succesfully',section==='title'?'news':section);
      } else if(kind==='censor') {
        requireAdmin();db.censor=[...new Set(String(values.get('words')||'').split(/\r?\n/).map(w=>w.trim()).filter(Boolean))];success('Successfully changed the local censorship list.','cadmin');
      } else if(kind==='file') {
        requireAdmin();const f=values.get('file');if(!(f instanceof File)||!f.size) throw new Error('Choose a non-empty file first.');
        if(f.size>250000) throw new Error('Choose a file no larger than 250 KB.');
        const ext=f.name.split('.').pop().toLowerCase();let type;
        if(ext==='txt') type='text/plain';else type={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif'}[ext];
        if(!type) throw new Error('This cabinet accepts text files and PNG, JPEG or GIF images only.');
        let content;
        if(type==='text/plain') content=await f.text();
        else {
          const blob=new Blob([await f.arrayBuffer()],{type});
          const bitmap=await createImageBitmap(blob);bitmap.close();
          content=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);});
        }
        if(db.files.reduce((n,x)=>n+(x.content?.length||0),0)+content.length>1000000) throw new Error('The local cabinet is full. Remove another local file before adding this one.');
        const id=nextId();db.files.push({id,name:f.name.slice(0,100),type,content});success('File added to this browser only.','file',{ID:id});
      }
    } catch(error) { fail(error.message||'That action could not be completed.',form); }
  });

  document.addEventListener('click',event=>{
    const control=event.target.closest('[data-action]');
    if(control) {
      event.preventDefault(); const action=control.dataset.action,id=Number(control.dataset.id);
      try {
        if(action==='logout') { currentUser=null;success('You are now viewing as Guest.','news'); }
        else if(action==='reset') {
          if(!confirm('Reset this demonstration? All local posts, members, edits and files will be removed.')) return;
          db=copy(seed);currentUser=null;storageAvailable=true;
          try {localStorage.removeItem(key);} catch(_){storageAvailable=false;}
          success('The fictional demonstration has been restored.','news');
        } else if(action==='format') { format(control); }
        else if(action==='toggle-lock'||action==='toggle-sticky'||action==='delete-topic') {
          const t=byId(db.topics,id);if(!t) throw new Error('That topic is unavailable.');requireModerator(t.forumId);
          if(action==='delete-topic') {if(!confirm('Are you sure you want to delete this topic and its posts from your local copy?')) return;removeTopic(id);success('Topic Deleted Successfully','forum',{forum_id:t.forumId});}
          else {const prop=action==='toggle-lock'?'locked':'sticky';t[prop]=!t[prop];success('Topic status updated locally.','topic',{topic_id:id,pagenum:route.pagenum||1});}
        } else if(action==='delete-post') {
          const p=byId(db.posts,id);if(!p) throw new Error('That post is unavailable.');requireModerator(p.forumId);
          if(!confirm('Delete this post from your local copy?')) return;
          db.posts=db.posts.filter(x=>x.id!==id);success('Post Deleted Successfully','topic',{topic_id:p.topicId,pagenum:route.pagenum||1});
        } else if(action==='delete-forum') {
          requireAdmin();const f=byId(db.forums,id);if(!f) throw new Error('That forum is unavailable.');
          if(!confirm('Are you sure you want to delete this forum and all its topics from your local copy?')) return;
          for(const t of topicsFor(id)) removeTopic(t.id);db.forums=db.forums.filter(x=>x.id!==id);success('Forum Deleted Successfully','forums');
        } else if(action==='delete-news') {
          requireAdmin();if(!confirm('Delete this news article from your local copy?')) return;db.news=db.news.filter(n=>n.id!==id);success('News article deleted locally.','nadmin');
        } else if(action==='delete-user'||action==='ban-user') {
          requireAdmin();const u=byId(db.users,id);if(!u) throw new Error('That user is unavailable.');
          if(u.username===currentUser) throw new Error('Switch to a different administrator before changing the current account in this way.');
          if(action==='delete-user') {if(!confirm('Delete this local user? Their forum posts will remain.')) return;db.users=db.users.filter(x=>x.id!==id);}
          else {if(!confirm('Are you sure you want to alter this user’s local ban status?')) return;u.banned=!u.banned;}
          success('User status updated locally.','uadmin');
        } else if(action==='delete-file') {
          requireAdmin();if(!confirm('Remove this file from the local cabinet list?')) return;db.files=db.files.filter(x=>x.id!==id);success('File removed from the local cabinet.','fadmin');
        }
      } catch(error) {fail(error.message);}
      return;
    }
    const a=event.target.closest('a[href]');
    if(!a||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0) return;
    const href=a.getAttribute('href');
    if(href?.startsWith('?')) {event.preventDefault();history.pushState(null,'',href);render(true);}
  });

  // PostWrite and toolbar names survive from the original editor.
  function PostWrite(textarea,code) {
    textarea.setRangeText(code,textarea.selectionStart,textarea.selectionEnd,'end');textarea.focus();
  }
  // Former toolbar helpers: Addbold, Additalic, Addunder, Addurl and Addimage.
  function format(control) {
    const textarea=control.closest('form').querySelector('textarea[name=body]');if(!textarea) return;
    const tag=control.dataset.tag,selected=textarea.value.slice(textarea.selectionStart,textarea.selectionEnd);
    if(['b','i','u'].includes(tag)) PostWrite(textarea,`<${tag}>${selected||'text'}</${tag}>`);
    else if(tag==='a') {
      const href=prompt('Enter a local page or supplied document link','?page=events');if(href===null) return;
      if(!safeLink(href)) throw new Error('Use a local link such as ?page=events or files/open-afternoon.txt.');
      PostWrite(textarea,`<a href="${esc(href)}">${esc(selected||'Link')}</a>`);
    } else {
      const href=prompt('Enter a supplied image path','assets/FarsightLogo.jpg');if(href===null) return;
      if(!safeLink(href)||!href.startsWith('assets/')) throw new Error('Use an image inside the supplied assets folder.');
      PostWrite(textarea,`<img src="${esc(href)}" alt="Demo image">`);
    }
  }
  /* The original MM_findObj() //v4.01 tried document.all, named forms,
     parent.frames and d.layers before getElementById. Those obsolete browser
     branches are historical context; the equivalent lookup now uses the DOM. */
  // MM_swapImage / MM_swapImgRestore //v3.0 — rollover behaviour retained.
  function MM_swapImage(img) {if(!img.dataset.original) img.dataset.original=img.getAttribute('src');img.src=img.dataset.hover;}
  function MM_swapImgRestore(img) {if(img.dataset.original) img.src=img.dataset.original;}
  const preloaded=new Set();
  function MM_preloadImages() { //v3.0
    for(const img of document.querySelectorAll('img[data-hover]')) if(!preloaded.has(img.dataset.hover)) {const p=new Image();p.src=img.dataset.hover;preloaded.add(img.dataset.hover);}
  }
  document.addEventListener('mouseover',e=>{const img=e.target.closest('img[data-hover]');if(img) MM_swapImage(img);});
  document.addEventListener('mouseout',e=>{const img=e.target.closest('img[data-hover]');if(img) MM_swapImgRestore(img);});
  document.addEventListener('focusin',e=>{const img=e.target.closest('a')?.querySelector('img[data-hover]');if(img) MM_swapImage(img);});
  document.addEventListener('focusout',e=>{const img=e.target.closest('a')?.querySelector('img[data-hover]');if(img) MM_swapImgRestore(img);});
  window.addEventListener('popstate',()=>render(true));
  render();
})();
