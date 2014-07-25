var app = angular.module('gbpApp', ['LocalStorageModule']);

app.config(['localStorageServiceProvider', function(localStorageServiceProvider) {
    localStorageServiceProvider.setPrefix("gbp");
}]);

app.controller('gbpController', function($http, $timeout, localStorageService) {

    var ctrl = this;

    /* ====== AUTHENTICATION =============================================== */

    var auth = null;

    (function() {
        // if we have pre-existing token, verify it to see if it's still good.
        var savedToken = localStorageService.get('auth');
        if (savedToken) {
            $http.post('api/auth/verify', {token: savedToken.token})
                .success(function(data) {
                    if (data.status) {
                        auth = savedToken;
                        start_refresh();

                    }
                })
        }
    })();

    ctrl.loginForm = {};

    ctrl.user = function() {
        return auth && auth.username;
    };

    ctrl.isAuthenticated = function() {
        return !!auth;
    };

    ctrl.login = function() {
        $http.post('api/auth/login', ctrl.loginForm)
            .success(function(data) {
                if (data.status) {
                    auth = {
                        token: data.token,
                        username: ctrl.loginForm.username
                    };
                    localStorageService.set('auth', auth);
                }
                ctrl.loginForm = {};
                start_refresh();
            });
    };

    ctrl.logout = function() {
        auth = null;
        localStorageService.remove('auth');
    };

    /* ====== GBP MAIN =============================================== */

    ctrl.state = null;
    ctrl.working = false;

    var start_refresh = function() {
       var refresh = function() {
           // assuming we are authenticated, pull status from service
           if (!auth) return;
           $http.post('api/garage/status', {token: auth.token})
               .success(function (data) {
                   ctrl.working = false;
                   ctrl.state = data;
                   $timeout(refresh, 1000);
               });
       };
        refresh();
    };

    ctrl.open = function() {
        ctrl.working = true;
        $http.post('api/garage/open', {token: auth.token});
    };

    ctrl.close = function() {
        ctrl.working = true;
        $http.post('api/garage/close', {token: auth.token});
    };

});