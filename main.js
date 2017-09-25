(  function(){
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

  function setSigninStatus(isSignedIn) {
    var user = GoogleAuth.currentUser.get();
    var isAuthorized = user.hasGrantedScopes(SCOPE);
    if (isAuthorized) {
      $('#sign-in-or-out-button').html('Sign out');
      $('#revoke-access-button').css('display', 'inline-block');
      $('#auth-status').html('You are currently signed in and have granted ' +
          'access to this app.');
      populateCalendarList();
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
document.forms.search.addEventListener('submit',function(e){
  e.preventDefault();
  var obj={}
  var types={};
  $(document.forms.search).serializeArray().forEach(function(item){
    if(item.value){
      switch(discoveryAPI.resources.events.methods.list.parameters[item.name].format){
        case "date-time":
          obj[item.name]=(new Date(item.value)).toISOString();
          break;
        default:
          types[discoveryAPI.resources.events.methods.list.parameters[item.name].format]=true;
          obj[item.name]=item.value;
      }
    }
  })
  console.log(obj);
  console.log(types);
  gapi.client.calendar.events.list(obj).then(console.log,console.error);
  return false;
})


var initializeForms=function(){
	var addStuff=createFormTable(discoveryAPI.resources.events.methods.list.parameters,listEventParams));
	addStuff.firstChild.removeChild(addStuff.firstChild.firstChild);
	document.forms.search.replaceChild(addStuff,document.forms.search.calendarId.nextSibling);
}

var listEventParams={
  calendarId:"To Be Removed",
  orderBy:"Order By",
  q:"Search Text",
  showDeleted:"Include Deleted",
  showHiddenInvitations:"Include Hidden Invitations",
  timeMax:"Starts Before",
  timeMin:"Ends After",
  updatedMin:"Modified Since"
}

var autoPrefix=0;
var createFormTable=function(parameters,labels,prefix){
  prefix=prefix|| "p"+(autoPrefix++);
  var mainDiv=document.createElement('div');
  var table=document.createElement('table');
  for(var name in labels){
    if(parameters[name]){
      table.appendChild(createRow(parameters[name],labels[name],prefix));
    }
  }
  mainDiv.appendChild(table);
  mainDiv.appendChild(document.createElement('label'));
  mainDiv.lastChild.innerText="Show All";
  mainDiv.lastChild.HTMLfor=prefix+"ShowAllCheckbox";
  mainDiv.appendChild(document.createElement('input'));
  mainDiv.lastChild.type='checkbox';
  mainDiv.lastChild.className='show-hide-next';
  table=document.createElement('table');
  for(var name in parameters){
    if(!labels[name]){
      table.appendChild(createRow(parameters[name],name,prefix));
    }
  }
  mainDiv.appendChild(table);
  return mainDiv;
}

var createRow=function(parameter,label,prefix){
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



})();