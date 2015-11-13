/**
 * Created by Bas Scholts on 09/11/2015.
 */

String.prototype.formatMoney = function (l, c, d, t) {
    return parseFloat(this).formatMoney(l, c, d, t);
};
Number.prototype.formatMoney = function (l, c, d, t) {
    var n = this,
        l = l == undefined ? '' : '\u20AC ',
        c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "," : d,
        t = t == undefined ? "." : t,
        s = n < 0 ? "- " : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + l + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};
function padNumber(n) {
    return (n.length < 2 ? '0' : '') + n;
}
var appData;
var raboControllers = angular.module('raboControllers', [])
    .config(function ($sceProvider) {
        $sceProvider.enabled(false);
    })
    .filter('currencyFormat', function () {
        return function (input, l, c, d, t) {
            return input.formatMoney(l, c, d, t)
        }
    })
    .filter('writeDutchDate', function () {
        return function (input) {
            input = new Date(input);
            var m = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'][input.getMonth()];
            return input.getDate() + ' ' + m
        }
    })
    .filter('reverseDate', function () {
        return function (input) {
            input = new Date(input);
            return padNumber(input.getDate()) + '-' + padNumber(input.getMonth() + 1) + '-' + input.getYear()
        }
    });
var raboApp = ons.bootstrap('raboApp', ['onsen', 'ngRoute', 'raboControllers'])
    .service('appDataService', function ($http, $rootScope) {
        appData = null;
        var promise = $http.get("/app/appdata.json").success(function (data) {
            appData = data;
            $rootScope.processData()
        });
        return {
            promise: promise,
            setData: function (data) {
                appData = data;
            },
            getAppData: function () {
                return appData;
            }
        }
    });

raboApp.run(function ($rootScope, $location) {
    $(document)[0].title = 'Rabo Bankieren app';
    $rootScope.navigateTo = function (url) {
        menu.close();
        $location.path(url);
    };
    $rootScope.toggleSplitView = function (view) {
        view['_activate' + (view._mode == 0 ? 'Collapse' : 'Split') + 'Mode']();
    };;
    $rootScope.processData = function () {
        $rootScope.actueelBerichten = appData.actueel;
        $rootScope.rekeningen = appData.accounts;
        $rootScope.creditCards = appData.cards;
        $rootScope.berichten = appData.messages;
    }
});;
var nc = function () {
    var d = new Date();
    return d.getTime().toString().substr(-6) + '' + d.getMilliseconds();
};;
var fgFocus = function () {
    $(this).closest('.fg-line').addClass('fg-toggled');
};
var fgBlur = function () {
    var p = $(this).closest('.form-group');
    var i = p.find('.form-control').val();

    if (p.hasClass('fg-float')) {
        if (i.length == 0) {
            $(this).closest('.fg-line').removeClass('fg-toggled');
        }
    }
    else {
        $(this).closest('.fg-line').removeClass('fg-toggled');
    }
};
var fgLine = function () {
    $(document.body).on('focus', '.form-control', fgFocus);;
    $(document.body).on('blur', '.form-control', fgBlur);
    $('.fg-float .form-control').each(function () {
        var i = $(this).val();
        if (!i.length == 0) {
            $(this).closest('.fg-line').addClass('fg-toggled');
        }
    });
};;

raboApp.controller('AppController', function ($scope) {
    ons.ready(function () {
    });
});
raboControllers
    .directive('rbLogin', ['$document', function ($document) {
        return {
            link: function (scope, element, attr) {
                element.on('submit', function (event) {
                    event.preventDefault();
                    scope.navigateTo('/overzicht');
                })
            }
        }
    }])
    .controller('LoginController', ['$scope', '$location', function ($scope, $location) {
        ons.ready(function () {
            $('#login-form').submit(function (e) {
                e.preventDefault();
                $location.path('/rekeningen')
            });;

            $(document).on('keyup', '#pinInput', function (e) {
                if (e.keyCode < 48 || e.keyCode > 57)
                    e.preventDefault();
            });;
            $(document).on('keyup', '#pinInput', function (e) {
                var masked = $(this).val().length;
                $('#pinMasks').toggleClass('empty', masked < 1);
                for (var i = 1; i <= 5; i++) {
                    $($('#pinMasks .mask')[i - 1]).toggleClass('mask-fill', i <= masked);
                }
                if (masked == 5) {
                    document.getElementById('login-form-submit').click();
                }
            });;
            $('#pinMasks').toggleClass('empty', $('#pinMasks').val().length <= 0);

            fgLine();
        });
    }])
    .controller('OverzichtController', ['$scope', function ($scope) {
        ons.ready(function () {
            $scope.actueleBerichten = [];
            for (var i = 0, j = 1; i < 3; i++, j++) {
                $scope.actueleBerichten[i] = appData.actueel[j];
                if (Array.isArray(appData.actueel[j].content))
                    $scope.actueleBerichten[i].content = appData.actueel[j].content[0].match(/^<p class='intro'>(.*)<\/p>$/i)[1];
            }
            $scope.rekeningen = appData.accounts;
            $scope.creditCards = appData.cards;

            fgLine();
        });
    }])
    .controller('BerichtenController', ['$scope', '$location', '$route', '$routeParams',
        function ($scope, $location, $route, $routeParams) {
            ons.ready(function () {
                if ($routeParams.berichtId < 1)
                    $routeParams.berichtId = 1;
                if (!appData.messages[$routeParams.berichtId])
                    $routeParams.berichtId = 1;
                $scope.berichtSelected = $routeParams.berichtId;
                $scope.actiefBericht = appData.messages[$scope.berichtSelected];
                if (Array.isArray($scope.actiefBericht.content))
                    $scope.actiefBericht.content = $scope.actiefBericht.content.join("\n");

                fgLine();
            });
        }
    ])
    .controller('ContactController', ['$scope', '$location', '$route', '$routeParams',
        function ($scope, $location, $route, $routeParams) {
            ons.ready(function () {
                if (!$routeParams.section)
                    $routeParams.section = 'chat';
                $scope.section = $routeParams.section;
                fgLine();
            });
        }
    ])
    .controller('ActueelController', ['$scope', '$location', '$route', '$routeParams',
        function ($scope, $location, $route, $routeParams) {
            ons.ready(function () {
                if ($routeParams.berichtId < 1)
                    $routeParams.berichtId = 1;
                if (!appData.actueel[$routeParams.berichtId])
                    $routeParams.berichtId = 1;

                $scope.berichtSelected = parseInt($routeParams.berichtId);
                $scope.actiefBericht = appData.actueel[$scope.berichtSelected];
                if (Array.isArray($scope.actiefBericht.content))
                    $scope.actiefBericht.content = $scope.actiefBericht.content.join("\n");

                fgLine();
            });
        }
    ])
    .controller('RekeningenController', ['$scope', '$location', '$route', '$routeParams',
        function ($scope, $location, $route, $routeParams) {
            ons.ready(function () {
                $scope.rekeningen = appData.accounts;
                $scope.creditCards = appData.cards;
                if ($routeParams.rekeningId < 1)
                    $routeParams.rekeningId = 1;
                if (!appData.accounts[$routeParams.rekeningId])
                    $routeParams.rekeningId = 1;
                $scope.rekeningSelected = $routeParams.rekeningId;

                $scope.isOverboeking = '';

                $scope.switchAccount = function (url) {
                    $location.path(url);
                };

                fgLine();
            });
        }
    ])
    .controller('RekeningDetailController', ['$scope', '$location', '$route', '$routeParams',
        function ($scope, $location, $route, $routeParams) {
            ons.ready(function () {
                $scope.rekeningen = appData.accounts;
                $scope.creditCards = appData.cards;
                if ($routeParams.rekeningId < 1)
                    $routeParams.rekeningId = 1;
                if (!appData.accounts[$routeParams.rekeningId])
                    $routeParams.rekeningId = 1;
                $scope.rekeningSelected = $routeParams.rekeningId;

                var transfers = [], lastDate = new Date(), cd, t;
                for (var i = 0; i < appData.accounts[$routeParams.rekeningId].transfers.length; i++) {
                    t = appData.accounts[$routeParams.rekeningId].transfers[i];
                    cd = new Date(t.date);
                    if (cd.getTime() != lastDate.getTime()) {
                        transfers.push({isDateRow: true, date: t.date, classList: 'transfer-date'});
                        lastDate = cd;
                    }
                    t.isDateRow = false;
                    t.classList = 'transfer transfer-' + (t.amount > 0 ? 'in' : 'out');
                    transfers.push(t);
                }
                $scope.accountTransfers = transfers;

                $scope.isOverboeking = '';

                $scope.switchAccount = function (url) {
                    $location.path(url);
                };
                refreshCarousel();

                fgLine();
            });
        }
    ])
    .controller('OverboekingController', ['$scope', '$location', '$route', '$routeParams',
        function ($scope, $location, $route, $routeParams) {
            ons.ready(function () {
                $scope.rekeningen = appData.accounts;
                if ($routeParams.rekeningId < 1)
                    $routeParams.rekeningId = 1;
                if (!appData.accounts[$routeParams.rekeningId])
                    $routeParams.rekeningId = 1;
                $scope.rekeningSelected = $routeParams.rekeningId;

                $scope.isOverboeking = 'overboeking/';

                refreshCarousel();
                fgLine();

                $(document).on('keydown', '#overboeking-bedrag-euro', function (e) {
                    if (e.keyCode == 110 || e.keyCode == 188 || e.keyCode == 190) {
                        e.preventDefault();
                        $('#overboeking-bedrag-cent').trigger('focus');
                    }
                    else if (e.keyCode < 48 && e.keyCode > 61)
                        e.preventDefault();
                });;
                $(document).on('blur', '#overboeking-naam', function (e) {
                    $(this).closest('.fg-line').toggleClass('fg-toggled', $(this).val().length != 0);
                });;
                $(document).on('blur', '#overboeking-bedrag-euro', function (e) {
                    if ($(this).val().length == 0)
                        $(this).val('0').closest('.fg-line').addClass('fg-toggled');
                });;
                $(document).on('blur', '#overboeking-bedrag-cent', function (e) {
                    if ($(this).val().length == 1)
                        $(this).val($(this).val() + '0');
                    else if ($(this).val().length == 0)
                        $(this).val('00');
                    $(this).closest('.fg-line').addClass('fg-toggled');
                });;

                $(document).on('click', '.address-book-selectable', function (e) {
                    $('#overboeking-naam').val($(this).find('.address-book-name').text()).closest('.fg-line').addClass('fg-toggled');
                    $('#overboeking-iban').val($(this).find('.address-book-iban').text()).closest('.fg-line').addClass('fg-toggled');
                    $scope.modalAddressBook.hide();
                });;
                $(document).on('keyup', '#frm-omschrijving-omschrijving', function (e) {
                    $('#frm-omschrijving-kenmerk')[0].disabled = ($(this).val() != '');
                    $('#omschrijving-count').text($(this).val().length + ' / 140');
                    if (e.keyCode == 13) $('#popup-omschrijving .popup-btn[data-rel=ok]').trigger('click');
                });;
                $(document).on('keyup', '#frm-omschrijving-kenmerk', function (e) {
                    $('#frm-omschrijving-omschrijving')[0].disabled = ($(this).val() != '');
                    if (e.keyCode == 13) $('#popup-omschrijving .popup-btn[data-rel=ok]').trigger('click');
                });;
                $(document).on('click', '#popup-omschrijving .popup-btn[data-rel=cancel]', function (e) {
                    $scope.modalOmschrijving.hide();
                });
                $(document).on('click', '#popup-omschrijving .popup-btn[data-rel=ok]', function (e) {
                    e.preventDefault();
                    var val = $('#frm-omschrijving-omschrijving').val();
                    if (val.length < 1)
                        val = $('#frm-omschrijving-kenmerk').val();
                    if (val.length < 1)
                        val = '';
                    $('#overboeking-omschrijving').val(val).closest('.fg-line').addClass('fg-toggled');
                    $scope.modalOmschrijving.hide();
                });
            });
        }
    ]);
var refreshCarousel = function () {
    try {
        if (!window.accountCarousel) throw new Error; window.accountCarousel.refresh();
        for (var i = 0; i < parseInt(window.accountCarousel._attrs.intialIndex); i++) { window.accountCarousel.next(); }
    } catch (e) { setTimeout(function () { refreshCarousel(); }, 50); }
};;

raboApp.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/login', {
            templateUrl: 'html/login.html',
            controller: 'LoginController',
            resolve: { 'appDataService': function (appDataService) { return appDataService.promise; } }
        })
        .when('/overzicht', {
            templateUrl: 'html/overzicht.html',
            controller: 'OverzichtController',
            resolve: { 'appDataService': function (appDataService) { return appDataService.promise; } }
        })
        .when('/rekeningen', {
            templateUrl: 'html/page.html',
            controller: 'RekeningenController',
            resolve: { 'appDataService': function (appDataService) { return appDataService.promise; } }
        })
        .when('/rekeningen/overboeking/:rekeningId', {
            templateUrl: 'html/overboekingen.html',
            controller: 'OverboekingController',
            resolve: { 'appDataService': function (appDataService) { return appDataService.promise; } }
        })
        .when('/rekeningen/:rekeningId', {
            templateUrl: 'html/page.html',
            controller: 'RekeningDetailController',
            resolve: { 'appDataService': function (appDataService) { return appDataService.promise; } }
        })
        .when('/berichten', {
            templateUrl: 'html/berichten.html',
            controller: 'BerichtenController',
            resolve: { 'appDataService': function (appDataService) { return appDataService.promise; } }
        })
        .when('/berichten/:berichtId', {
            templateUrl: 'html/berichten.html',
            controller: 'BerichtenController',
            resolve: { 'appDataService': function (appDataService) { return appDataService.promise; } }
        })
        .when('/actueel', {
            templateUrl: 'html/actueel.html',
            controller: 'ActueelController',
            resolve: { 'appDataService': function (appDataService) { return appDataService.promise; } }
        })
        .when('/actueel/:berichtId', {
            templateUrl: 'html/actueel.html',
            controller: 'ActueelController',
            resolve: { 'appDataService': function (appDataService) { return appDataService.promise; } }
        })
        .when('/contact', {
            templateUrl: 'html/contact.html',
            controller: 'ContactController',
            resolve: { 'appDataService': function (appDataService) { return appDataService.promise; } }
        })
        .when('/contact/:section', {
            templateUrl: 'html/contact.html',
            controller: 'ContactController',
            resolve: { 'appDataService': function (appDataService) { return appDataService.promise; } }
        })
        .when('/info', {
            templateUrl: 'html/info.html',
            resolve: { 'appDataService': function (appDataService) { return appDataService.promise; } }
        })
        .otherwise({redirectTo: '/login'})
}]);

$(document).on('click', '.transfer', function (e) {
    e.preventDefault();
    var d = $(this).hasClass('expanded'), h, pc;
    $(this).toggleClass('expanded', true);
    h = $(this).find('.transfer-details').css('height');
    $(this).toggleClass('expanded', !d);
    if (!$(this).visible() && !d) {
        pc = $('#transfer-list-page').find('.page__content').first();
        pc.animate({scrollTop: pc.scrollTop() + h}, 125)
    }
});

/** jQuery visible plugin | Author: Digital Fusion, http://teamdf.com/ | Source: https://github.com/customd/jquery-visible/ | License: MIT */
!function(t){var i=t(window);t.fn.visible=function(t,e,o){if(!(this.length<1)){var r=this.length>1?this.eq(0):this,n=r.get(0),f=i.width(),h=i.height(),o=o?o:"both",l=e===!0?n.offsetWidth*n.offsetHeight:!0;if("function"==typeof n.getBoundingClientRect){var g=n.getBoundingClientRect(),u=g.top>=0&&g.top<h,s=g.bottom>0&&g.bottom<=h,c=g.left>=0&&g.left<f,a=g.right>0&&g.right<=f,v=t?u||s:u&&s,b=t?c||a:c&&a;if("both"===o)return l&&v&&b;if("vertical"===o)return l&&v;if("horizontal"===o)return l&&b}else{var d=i.scrollTop(),p=d+h,w=i.scrollLeft(),m=w+f,y=r.offset(),z=y.top,B=z+r.height(),C=y.left,R=C+r.width(),j=t===!0?B:z,q=t===!0?z:B,H=t===!0?R:C,L=t===!0?C:R;if("both"===o)return!!l&&p>=q&&j>=d&&m>=L&&H>=w;if("vertical"===o)return!!l&&p>=q&&j>=d;if("horizontal"===o)return!!l&&m>=L&&H>=w}}}}(jQuery);