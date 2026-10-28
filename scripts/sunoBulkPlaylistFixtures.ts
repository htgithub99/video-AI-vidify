export const sunoBulkPlaylistFixture = (ids: string[], playlistName: string, pageSize = 40): string => `
<button aria-label="Profile menu button">Profile</button><input aria-label="Search clips">
<button aria-label="Previous page">Previous</button><input aria-label="Current page number" value="1"><button aria-label="Next page" id="next">Next</button>
<div class="clip-browser-list-scroller" style="height:360px;overflow:auto"><div id="rows" style="position:relative"></div></div>
<div role="menu" hidden><div role="menuitem" aria-label="Add to Playlist" onclick="this.parentElement.hidden=true;document.querySelector('[role=dialog]').hidden=false">Add to Playlist</div></div>
<div role="dialog" aria-label="Add to Playlist" hidden><input placeholder="Playlist name"><div id="existing">${playlistName}</div><button id="create">Create playlist</button></div>
<script>
const ids=${JSON.stringify(["unrelated-id", ...ids])};const selected=new Set();let pageIndex=0;const pageSize=${pageSize};
const scroller=document.querySelector('.clip-browser-list-scroller');const rows=document.querySelector('#rows');
function render(){const list=ids.slice(pageIndex*pageSize,(pageIndex+1)*pageSize);rows.style.height=list.length*52+'px';const start=Math.max(0,Math.floor(scroller.scrollTop/52)-2);rows.innerHTML=list.slice(start,start+12).map((id,i)=>'<div data-testid="clip-row" style="position:absolute;height:52px;top:'+((start+i)*52)+'px"><button data-id="'+id+'" aria-label="'+(selected.has(id)?'Deselect clip':'Select clip')+'">Select</button><a href="/song/'+id+'">'+id+'</a><button aria-label="More options">More</button></div>').join('');document.querySelector('#next').disabled=(pageIndex+1)*pageSize>=ids.length;}
rows.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.id){if(selected.has(b.dataset.id))selected.delete(b.dataset.id);else selected.add(b.dataset.id);b.setAttribute('aria-label',selected.has(b.dataset.id)?'Deselect clip':'Select clip');}else document.querySelector('[role=menu]').hidden=false;};
scroller.onscroll=render;document.querySelector('#next').onclick=()=>{pageIndex++;selected.clear();scroller.scrollTop=0;document.querySelector('[aria-label="Current page number"]').value=String(pageIndex+1);render();};
async function mutate(url){const response=await fetch('https://studio-api-prod.suno.com/api/playlist/'+url+'/',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ids:[...selected]})});if(response.ok)document.querySelector('[role=dialog]').hidden=true;}
document.querySelector('#create').onclick=()=>mutate('create');document.querySelector('#existing').onclick=()=>mutate('update_clips');render();
</script>`;
