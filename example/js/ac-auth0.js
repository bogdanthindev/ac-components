angular.module('acComponentsExampleApp')
    .config(['authProvider', '$httpProvider', 'jwtInterceptorProvider', function (authProvider, $httpProvider, jwtInterceptorProvider) {

        authProvider.init({
            domain: 'avalancheca.auth0.com',
            clientID: 'mcgzglbFk2g1OcjOfUZA1frqjZdcsVgC',
            loginUrl: '/'
        });

        authProvider.on('loginSuccess', function($location, profilePromise, idToken, store) {
            console.log('Login Success');
            profilePromise.then(function(profile) {
              store.set('profile', profile);
              store.set('token', idToken);
            });
            $location.hash('');
            $location.path('/');
        });

        authProvider.on('authenticated', function() {
            console.log('Authenticated');
        });

        authProvider.on('logout', function(store) {
            store.remove('profile');
            store.remove('token');
        });

        jwtInterceptorProvider.tokenGetter = ['store', function (store) {
            return store.get('token');
        }];

        $httpProvider.interceptors.push('jwtInterceptor');
    }])
    .run(function (auth) {
        // hooks routing requiresLogin data attribute
        auth.hookEvents();
    })