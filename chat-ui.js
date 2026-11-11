export function installChatUI(api){const $=id=>document.getElementById(id);let opened=false;
 function close(resume=true){if(!opened)return;opened=false;$('chatpanel').hidden=true;api.close(resume)}
 function toggle(){if(opened){close();return}if(!api.canOpen()){api.message('멀티플레이 방에서 채팅할 수 있습니다.');return}opened=true;$('chatpanel').hidden=false;api.open();$('chatinput').focus?.()}
 async function send(){const text=$('chatinput').value;const result=await api.send(text);if(result){$('chatinput').value='';$('chatnotice').textContent='전송 완료'}else $('chatnotice').textContent='빈 메시지이거나 너무 빠른 전송입니다. 잠시 뒤 다시 보내세요.'}
 $('chatbutton').onclick=toggle;$('chatclose').onclick=()=>close();$('chatsend').onclick=send;
 return {toggle,close,send,get opened(){return opened},receive(rows){$('chatmessages').replaceChildren();for(const row of rows.slice(-16)){const p=document.createElement('p'),name=document.createElement('strong'),text=document.createElement('span');name.textContent=row.name+' · ';text.textContent=row.text;p.append(name,text);$('chatmessages').append(p)}$('chatmessages').scrollTop=$('chatmessages').scrollHeight}};
}
