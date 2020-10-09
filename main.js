let handleClientLoad=(  function(){
  var GoogleAuth;
  var SCOPE = 'https://www.googleapis.com/auth/calendar';
  function handleClientLoad() {
    // Load the API's client and auth2 modules.
    // Call the initClient function after the modules load.
    gapi.load('client:auth2', initClient);
  }

  function initClient() {
    // Retrieve the discovery document for version 3 of Google Drive API.
    // In practice, your app can retrieve one or more discovery documents.
    var discoveryUrl = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
    
    $.ajax({
      dataType: "json",
      url: discoveryUrl,
      success: (responce)=>{
		  discoveryAPI=responce;
		  initializeForms();
		  }
    });

    
    // Initialize the gapi.client object, which app uses to make API requests.
    // Get API key and client ID from API Console.
    // 'scope' field specifies space-delimited list of access scopes.
    gapi.client.init({
        'apiKey': 'AIzaSyAIeh9UbKwZvh2rDzIHneD0afADrH0GFSI',
        'discoveryDocs': [discoveryUrl],
        'clientId': '873022610329-t3o1o1h6oj80rqpai86p94t1h849177d.apps.googleusercontent.com',
        'scope': SCOPE
    }).then(function () {
      GoogleAuth = gapi.auth2.getAuthInstance();

      // Listen for sign-in state changes.
      GoogleAuth.isSignedIn.listen(updateSigninStatus);

      // Handle initial sign-in state. (Determine if user is already signed in.)
      var user = GoogleAuth.currentUser.get();
      setSigninStatus();

      // Call handleAuthClick function when user clicks on
      //      "Sign In/Authorize" button.
      $('#sign-in-or-out-button').click(function() {
        handleAuthClick();
      }); 
      $('#revoke-access-button').click(function() {
        revokeAccess();
      }); 
    });
  }

  function handleAuthClick() {
    if (GoogleAuth.isSignedIn.get()) {
      // User is authorized and has clicked 'Sign out' button.
      GoogleAuth.signOut();
    } else {
      // User is not signed in. Start Google auth flow.
      GoogleAuth.signIn();
    }
  }

  function revokeAccess() {
    GoogleAuth.disconnect();
  }
var colorSelect=null
  function setSigninStatus(isSignedIn) {
    var user = GoogleAuth.currentUser.get();
    var isAuthorized = user.hasGrantedScopes(SCOPE);
    if (isAuthorized) {
      $('#sign-in-or-out-button').html('Sign out');
      $('#revoke-access-button').css('display', 'inline-block');
      $('#auth-status').html('You are currently signed in and have granted ' +
          'access to this app.');
      populateCalendarList();
      gapi.client.calendar.colors.get()
	.then(resp=>{
        colorSelect=document.createElement('select')
        let op=document.createElement('option')
        op.innerHTML='unchanged'
        colorSelect.appendChild(op)
        for(let color in resp.result.event){
            let op=document.createElement('option')
            op.style.color=resp.result.event[color].background
            op.value=color
            op.innerHTML='&#x2B24;'
            colorSelect.appendChild(op)
        }
        colorSelect.addEventListener('change',updateColorOfSelectOnChange)
        for(let input of document.querySelectorAll('input[name=colorId]')){
          var newSel=colorSelect.cloneNode(true)
          newSel.name=input.name
          newSel.addEventListener('change',updateColorOfSelectOnChange)
          newSel.selectedIndex=-1;
          input.replaceWith(newSel)
        }
    })
    } else {
      $('#sign-in-or-out-button').html('Sign In/Authorize');
      $('#revoke-access-button').css('display', 'none');
      $('#auth-status').html('You have not authorized this app or you are ' +
          'signed out.');
    }
  }

  function updateSigninStatus(isSignedIn) {
    setSigninStatus();
  }
    
  var populateCalendarList=function(){
    gapi.client.calendar.calendarList.list()
    .then(function(responce){
      if(!responce.result){
        return;
      }
      var sel=document.forms.search['calendarId'];
      for(var i in responce.result.items){
        var opt=document.createElement('option');
        opt.text=responce.result.items[i].summary;
        opt.value=responce.result.items[i].id;
        sel.appendChild(opt);
      }
    });
  }
  var searchResults=null;
document.forms.search.addEventListener('submit',function(e){
  var obj=prep_form_to_send(e,discoveryAPI.resources.events.methods.list.parameters)
  gapi.client.calendar.events.list(obj).then(gotSearchResults.bind(null,obj),console.error);
  return false;
})


var patch_body=null
document.forms.patch.addEventListener('submit',function(e){
  if(remaining_to_patch.length){
    e.preventDefault();
    console.error('attempted patch while already patching')
    return false;
  }
  patch_body=prep_form_to_send(e,discoveryAPI.schemas.Event.properties)
  remaining_to_patch=searchResults.responce.items.slice()
  progress_bar.max=remaining_to_patch.length
  progress_bar.value=+progress_bar.max-remaining_to_patch.length
  document.body.appendChild(progress_bar)
  
  doPatch()

  return false;
})
var progress_bar=document.createElement('progress')
var remaining_to_patch=[]
function doPatch(){
    let next=remaining_to_patch.pop()
    progress_bar.value=+progress_bar.max-remaining_to_patch.length
    if(next){
        return gapi.client.calendar.events.patch({
          calendarId:searchResults.calendarId,
          eventId:next.id
          },patch_body)
        .then(doPatch,console.error)
    }
    progress_bar.remove()
}

function prep_form_to_send(e,fields){
  e.preventDefault();
  var obj={}
  var types={};
  $(e.target).serializeArray().forEach(function(item){
    if(item.value){
      let format=fields[item.name].format;
      switch(format){
        case "date-time":
          obj[item.name]=(new Date(item.value)).toISOString();
          break;
        case undefined:
          obj[item.name]=item.value;
          break;
        default:
          types[format]=true;
          obj[item.name]=item.value;
      }
    }
  })
  if(types.length){
    console.warn(types)
  }
  return obj
}

var searchResults=null;
function gotSearchResults(searchobj,results){
    searchResults=searchobj
    searchResults.responce=results.result;
    document.getElementById('found_count').innerText=searchResults.responce.items.length
}


var initializeForms=function(){
	var addStuff=createFormTable(discoveryAPI.resources.events.methods.list.parameters,listEventParams);
	document.forms.search.replaceChild(addStuff,document.forms.search.calendarId.nextElementSibling);
	var edit=createFormTable(discoveryAPI.schemas.Event.properties,editEventParams)
	document.forms.patch.replaceChild(edit,document.forms.patch.firstElementChild)
}

var listEventParams={
  calendarId:"",
  orderBy:"",
  q:"Search Text",
  showDeleted:"Include Deleted",
  showHiddenInvitations:"Include Hidden Invitations",
  timeMax:"Starts Before",
  timeMin:"Ends After",
  updatedMin:"Modified Since"
}

var editEventParams={
  id:"",
  updated:"",
  created:"",
  privateCopy:"",
  locked:"",
  recurringEventId:"",
  kind:"",
  etag:"",
  organizer:"",
  iCalUID:"",
  originalStartTime:"",
  creator:"",
  start:"",
  end:"",
  summary:"Summary",
  description:"Description",
  location:"Location",
  colorId:"Color",
  visibility:"Visibility"
}

var autoPrefix=0;
var createFormTable=function(parameters,labels,prefix){
  prefix=prefix|| "p"+(autoPrefix++);
  var mainDiv=document.createElement('div');
  var table=document.createElement('table');
  for(var name in labels){
    if(parameters[name] && labels[name]){
      table.appendChild(createRow(name,parameters[name],labels[name],prefix));
    }
  }
  mainDiv.appendChild(table);
  mainDiv.appendChild(document.createElement('label'));
  mainDiv.lastChild.innerText="Show Advanced Parameters";
  mainDiv.lastChild.htmlFor=prefix+"ShowAllCheckbox";
  mainDiv.appendChild(document.createElement('input'));
  mainDiv.lastChild.type='checkbox';
  mainDiv.lastChild.className='show-hide-next';
  mainDiv.lastChild.id=prefix+"ShowAllCheckbox";
  table=document.createElement('table');
  for(var name in parameters){
    if(typeof labels[name] == 'undefined'){
      table.appendChild(createRow(name, parameters[name],name,prefix));
    }
  }
  mainDiv.appendChild(table);
  return mainDiv;
}

var createRow=function(name, parameter,label,prefix){
  var row=document.createElement('tr');
  var cell=document.createElement('td');
  cell.appendChild(document.createElement('input'));
  switch(parameter.type){
    case "boolean":
      cell.firstChild.type='checkbox';
      break;
    case "integer":
      cell.firstChild.type='number';
      if(parameter.min){
        cell.firstChild.min=parameter.min;
      }
      if(parameter.max){
        cell.firstChild.max=parameter.max;
      }
      break;
    case "string":
      if(parameter.enum){
        cell.replaceChild(document.createElement('select'),cell.firstChild);
        cell.firstChild.appendChild(document.createElement('option'));
        for(var i in parameter.enum){
          cell.firstChild.appendChild(document.createElement('option'));
          cell.firstChild.lastChild.innerText=parameter.enum[i];
        }
      }else if(parameter.format){
        switch(parameter.format){
          case "date-time":
            cell.firstChild.type="datetime-local";
        }
      }
      break;
    default:
      console.warn("Unknown Parameter type:"+parameter.type+' for '+name);
  }
  cell.firstChild.id=prefix+name;
  cell.firstChild.name=name;
  cell.title=parameter.description;
  row.appendChild(cell);
  cell=document.createElement('td');
  cell.appendChild(document.createElement('label'));
  cell.firstChild.innerText=label;
  cell.firstChild.htmlFor=prefix+name;
  row.insertBefore(cell,row.firstChild);
  return row;
}

function updateColorOfSelectOnChange(e){
  let sel=e.target
  sel.style.color=sel.selectedOptions[0].style.color
  if(sel.selectedIndex==0){
    sel.selectedIndex=-1;
  }
}



return handleClientLoad;
})();