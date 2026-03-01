/*
* Kenz Technology Custom Scripts
*/

(function ($) {
    'use strict';

    function sidebar_niceScroll() {
        $('.side-menu .side-menu-icons > ul, .side-menu .side-menu-items > ul.dropdown-list').niceScroll({
            cursorcolor: "rgba(0,0,0,0.35)",
            cursorborder: "0px",
            cursorwidth: "3px",
        });
    }

    frappe.auth = {};


    $(document).ready(function () {

        // navbar search
        $(this).on('click', '.dv-navbar .open-search', function (event) {
            event.preventDefault();
            $('.dv-navbar .dv-nav-search').fadeIn();
            $('.dv-navbar .dv-nav-search .form-control').trigger('focus');
        });
        $(this).on('click', '.dv-navbar .dv-nav-search .dv-nav-search-close', function (event) {
            event.preventDefault();
            $('.dv-navbar .dv-nav-search').fadeOut();
        });

        $(this).on('click', '.dv-navbar .btn-open-mobile-menu', function (event) {
            event.preventDefault();
            if ($(this).hasClass('show-menu')) {
                $(this).removeClass('show-menu').find('i').addClass('fa-bars').removeClass('fa-times');
                $('.side-menu').hide();
                $('.side-mobile-menu').hide();
            } else {
                $(this).addClass('show-menu').find('i').removeClass('fa-bars').addClass('fa-times');
                $('.side-menu').show();
                $('.side-mobile-menu').show();
            }
        });
        // $(this).on('focus', '.dv-navbar .dv-nav-search .form-control', function (event) {
        //     $('.dv-app-theme').addClass('show-overlay');
        // }).on('blur', '.dv-navbar .dv-nav-search .form-control', function (event) {
        //     $('.dv-app-theme').removeClass('show-overlay');
        // });

        $(this).on("page-change", function () {
            $('.dv-app-theme').removeClass('show-overlay');
            // $('.dv-navbar .dv-nav-search').fadeOut();
            // $('.dv-navbar .dv-nav-search .form-control').trigger('blur');
        });

        // tooltip
        $('[data-toggle="tooltip"]').tooltip({boundary: 'window'});
        $('[data-toggle="tipsy"]').tipsy({fade: true, gravity: 'w'});

        // side menu
        $(this).on('click', '.side-menu .side-menu-icons > ul > li > a', function (event) {
            $(this).parents('ul').find('>li').removeClass('active');
            $(this).parent().addClass('active');
        })
        // files icon
        $(this).on('click', '.dv-navbar .files-icon', function (event) {
            event.preventDefault();
            frappe.set_route("List", "File");
        });
        // files icon
        $(this).on('click', '.dv-navbar .full-screen-icon', function (event) {
            event.preventDefault();
            $('body').fullscreen();
            if ($.fullscreen.isFullScreen()) {
                $('i', this).removeClass('fa-compress').addClass('fa-expand');
                $.fullscreen.exit();
            } else {
                $('i', this).removeClass('fa-expand').addClass('fa-compress');
            }
        });

        // change language according to data-language of dropdown item
        $(this).on("click", "#header-navbar-change-lang .dropdown-item", function (event) {
            event.preventDefault();
            let $this = $(this);
            // $this.siblings(".selected").removeClass("selected");
            let language = $this.data('lang');
            let selected_flag = $this.find(".dv-lang-flag").attr("class");
            $("#header-navbar-change-lang .dropdown-lang-link").html(`<span class="${selected_flag}"></span> ${language}`);
            frappe.call({
                method: "datavalue_theme_15.api.change_language",
                args: {
                    language: language.toLowerCase()
                },
                callback: function (r) {
                    localStorage.setItem("active_lang", language);
                    frappe.ui.toolbar.clear_cache();
                }
            });
        });

        $(this).on('click', '.side-menu .side-menu-items > ul.dropdown-list > li > a, .side-menu ul.mobile-modules-menu-list > li > a', function () {
            if ($(this).parent().hasClass('active')) {
                if (!$(this).parent().hasClass('hide-sub-menu')) {
                    $(this).parent().addClass('hide-sub-menu');
                    $(this).parent().find('>ul').slideUp();
                } else {
                    $(this).parent().removeClass('hide-sub-menu');
                    $(this).parent().find('>ul').slideDown();
                }
            } else {
                $('.side-menu .side-menu-items > ul.dropdown-list > li, .side-menu ul.mobile-modules-menu-list > li').removeClass('hide-sub-menu active').find('>ul').slideUp();
                $(this).parent().removeClass('hide-sub-menu').addClass('active');
                $(this).parent().find('>ul').slideDown();
            }
            setTimeout(() => {
                $('.side-menu .side-menu-items > ul.dropdown-list').getNiceScroll().resize();
            }, 500);
        });

        $(this).on('mouseover', '.animated-tada', function () {
            $('.animated-icon', this).addClass('animated tada');
        }).on('mouseout', function () {
            $('.animated-icon', this).removeClass('animated tada');
        });

        $(this).on('mouseover', '.btn-toggle-main-menu', function () {
            let is_menu_shown = $(this).hasClass('menu-shown');
            if (is_menu_shown) {
                $('>i.far', this).removeClass('fa-bars fa-chevron-double-right').addClass('fa-chevron-double-left');
            } else {
                $('>i.far', this).removeClass('fa-bars fa-chevron-double-left').addClass('fa-chevron-double-right');
            }
        }).on('mouseout', '.btn-toggle-main-menu', function () {
            $('>i.far', this).removeClass('fa-chevron-double-left fa-chevron-double-right').addClass('fa-bars');
        });

        $(this).on('click', '.btn-toggle-main-menu', function () {
            let is_menu_shown = $(this).hasClass('menu-shown');
            if (is_menu_shown) {
                $(this).removeClass('menu-shown');
                $('body').addClass('hide-main-menu');
            } else {
                $(this).addClass('menu-shown');
                $('body').removeClass('hide-main-menu');
            }
        });


        $(this).on('click', '.btn-open-modules', function () {
            if ($(this).hasClass('active')) {
                $(this).removeClass('active').find('i').removeClass().addClass('flaticon-menu');
                $('.modules-menu').fadeOut();
            } else {
                $(this).addClass('active').find('i').removeClass().addClass('fal fa-times');
                $('.modules-menu').toggle(300);
            }
        });

    });

    $(document).on("page-change", function () {
        $('.btn-open-modules').removeClass('active').find('i').removeClass().addClass('flaticon-menu');
        $('.modules-menu').fadeOut();
        if (window.innerWidth <= 820) {
            $('.dv-navbar .dv-nav-search').hide();
            $('.dv-navbar .btn-open-mobile-menu').removeClass('show-menu').find('i').addClass('fa-bars').removeClass('fa-times');
            $('.side-menu').hide();
            $('.side-mobile-menu').hide();
        }
    });

    $(document).on("app-loaded", function () {

        if (frappe.is_app_loaded)
            return;

        let AppLogoVM = new Vue({
            el: '#datavalue-app-logo',
            delimiters: ["[[", "]]"],
            data: {
                logo_path: '',
                logo_class: '',
                user: {},
            },
            methods: {
                logo_link() {
                    let default_workspace = $('body').data('default-workspace');
                    if (default_workspace) {
                        return '/app/' + (default_workspace.replace(/ /g, "-")).toLowerCase();
                    } else {
                        return '/app';
                    }
                },
                get_company_logo: function () {
                    const $this = this;
                    let logo = 'datavalue-new-logo.svg';
                    if ($('html').attr('data-theme-mode') == 'dark') {
                        logo = 'datavalue-new-logo-light.svg';
                    }
                    frappe.call({
                        type: 'POST',
                        method: 'datavalue_theme_15.api.get_company_logo',
                        args: {},
                        callback: async function (response) {
                            if (response.message && response.message.length) {
                                $this.logo_path = response.message;
                                $this.logo_class = 'has-company-logo';
                            } else {
                                $this.logo_class = '';
                                $this.logo_path = `/assets/datavalue_theme_15/images/${logo}`;
                            }
                        }
                    });
                }
            },
            async mounted() {
                let logo = 'datavalue-new-logo.svg';
                if ($('html').attr('data-theme-mode') == 'dark') {
                    logo = 'datavalue-new-logo-light.svg';
                }
                if (frappe.theme_settings && frappe.theme_settings.theme_logo && frappe.theme_settings.theme_logo.length) {
                    this.logo_path = frappe.theme_settings.theme_logo;
                    this.logo_class = 'has-company-logo';
                } else {
                    this.logo_class = '';
                    this.logo_path = `/assets/datavalue_theme_15/images/${logo}`;
                }
            },
            created: function () {
                this.user = frappe.get_cookies();
            }
        });

        new Vue({
            el: '#header-navbar-user',
            delimiters: ["[[", "]]"],
            data: {
                user: {},
                user_type: ''
            },
            created: function () {
                this.user = frappe.get_cookies();
                frappe.db.get_value('User', this.user.user_id, 'user_type', (response) => {
                    if (this.user.user_id == 'Administrator') {
                        this.user_type = __('Administrator');
                    } else {
                        this.user_type = (response.user_type) ? __(response.user_type) : __('User');
                    }
                    frappe.auth['user'] = this.user;
                    frappe.auth['user'].user_type = this.user_type;
                    frappe.auth['user'].user_roles = frappe.user_roles;
                });
            }
        });

        new Vue({
            el: '#header-navbar-change-lang',
            delimiters: ["[[", "]]"],
            data: {
                hide_language_icon: $('body').data('hide-language-icon'),
                egypt_language_icon: (frappe.theme_settings && frappe.theme_settings.egypt_language_icon && frappe.theme_settings.egypt_language_icon === '1') ? 'eg-flag' : '',
                lang_list: {
                    EN: {
                        label: 'EN',
                        flag: 'dv-lang-flag lang-en'
                    },
                    AR: {
                        label: 'AR',
                        flag: 'dv-lang-flag lang-ar'
                    }
                },
                active_lang: 'EN'
            },
            methods: {
                get_current_language: function () {
                    const $this = this;
                    frappe.call({
                        method: "datavalue_theme_15.api.get_current_language",
                        args: {},
                        callback: function (response) {
                            if (response && response.message && response.message) {
                                $this.active_lang = (response.message).toUpperCase();
                            } else {
                                $this.active_lang = localStorage.getItem("active_lang").toUpperCase() || 'EN';
                            }
                        }
                    });
                }
            },
            created: function () {
                this.get_current_language();
            }
        });


        // list-sidebar .sidebar-section
        $(document).on('click', '.list-sidebar .sidebar-section > li.sidebar-label, .form-sidebar > .sidebar-menu > li.sidebar-label', function () {
            let parent = $(this).parent();
            parent.toggleClass('hide-content');
        });

        $(document).on('click', '.content.page-container:visible .menu-btn-group .dropdown-menu .dropdown-item', function () {
            let reload_btn = $('[data-label="' + __('Reload') + '"]', this);
            if (reload_btn.length) {
                setTimeout(() => {
                    $(document).trigger('page-change');
                }, 500);
            }
        })

    });

})(jQuery);
