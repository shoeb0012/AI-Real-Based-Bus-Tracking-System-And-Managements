(() => {
  'use strict';
  const auth={user:null,ready:null};
  async function request(url,options={}){
    const headers={...(options.headers||{})};
    if(options.body&&!headers['Content-Type'])headers['Content-Type']='application/json';
    const response=await fetch(url,{...options,headers,credentials:'same-origin'});
    const data=response.status===204?{}:await response.json().catch(()=>({}));
    if(!response.ok){const error=new Error(data.error||'The request could not be completed.');error.status=response.status;throw error;}
    return data;
  }
  async function refresh(){
    try{const data=await request('/api/auth/me');auth.user=data.user;}
    catch(error){auth.user=null;if(error.status!==401)console.warn('Account status could not be checked.');}
    updateHeader();return auth.user;
  }
  async function signOut(){await request('/api/auth/logout',{method:'POST'});auth.user=null;updateHeader();}
  function updateHeader(){
    const button=document.querySelector('#authNavButton');if(!button)return;
    if(auth.user){button.textContent='Sign out';button.title=`Signed in as ${auth.user.role}`;button.setAttribute('aria-label',`Sign out ${auth.user.name}`);button.onclick=async()=>{try{await signOut();button.textContent='Sign in';window.location.href='login.html';}catch(_){window.location.href='login.html';}};}
    else{button.textContent='Sign in';button.setAttribute('aria-label','Sign in to AI Bus Track');button.onclick=()=>{const next=window.location.pathname+window.location.search+window.location.hash;window.location.href=`login.html?next=${encodeURIComponent(next)}`;};}
  }
  auth.request=request;
  auth.signOut=signOut;
  auth.refresh=refresh;
  auth.ready=refresh();
  window.AIBusAuth=auth;
})();
