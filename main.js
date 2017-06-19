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
  $(document.forms.search).serializeArray().foreach(function(item){
    if(item.value){
      obj[item.name]=item.value;
    }
  })
  console.log(obj);
  return false;
})