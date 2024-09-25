// Copyright (c) 2021, Abdo Hamoud and contributors
// For license information, please see license.txt

frappe.ui.form.on('Theme Settings', {
    refresh: function (frm) {
        $('[data-fieldname="font_family"] select').chosen({width: '50%'})
    },
    after_save: function (frm) {
        setTimeout(() => frappe.ui.toolbar.clear_cache(), 500);
    }
});
