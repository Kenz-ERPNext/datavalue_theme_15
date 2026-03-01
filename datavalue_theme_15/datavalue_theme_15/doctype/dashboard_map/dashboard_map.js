// Copyright (c) 2024, Abdo Hamoud and contributors
/*
* Kenz Technology Team
* Author: Abdo Hamoud
* Email: abdo.host@gmail.com
* Website: https://www.abdo-host.com
* Website: https://kenztechnology.com
*/

frappe.ui.form.on("Dashboard Map", {

    onload(frm) {

    },

    validate(frm) {

    },

    refresh(frm) {

        const formBody = $(frm.body);

        // fill doctype fields list
        if (frm.doc.__islocal) {
            formBody.on('blur', 'input[data-fieldname="doctype_name"]', function () {
                setTimeout(() => {
                    let doctype_name = $(this).val();
                    frm.events.fillDoctypeFields(doctype_name, frm);
                }, 200);
            });
        } else {
            if (frm.doc.doctype_name) {
                frm.events.fillDoctypeFields(frm.doc.doctype_name, frm);
            }
            formBody.on('blur', 'input[data-fieldname="doctype_name"]', function () {
                setTimeout(() => {
                    let doctype_name = $(this).val();
                    frm.events.fillDoctypeFields(doctype_name, frm);
                }, 200);
            });
        }

    },

    fillDoctypeFields(doctype_name, frm) {
        let fields_list = [];
        let all_fields_list = [];
        if (doctype_name && doctype_name.length) {
            frappe.model.with_doctype(doctype_name, () => {
                // get all date and datetime fields
                frappe.get_meta(doctype_name).fields.map((df) => {
                    if (["Geolocation"].includes(df.fieldtype)) {
                        fields_list.push({label: df.label, value: df.fieldname});
                    }
                    if (["Data"].includes(df.fieldtype)) {
                        all_fields_list.push({label: df.label, value: df.fieldname});
                    }
                });
                frm.set_df_property("title_field", "options", all_fields_list);
                if (fields_list.length) {
                    frm.set_df_property("doctype_field", "options", fields_list);
                } else {
                    frm.set_df_property("doctype_field", "options", []);
                    frappe.msgprint({
                        message: __("Doctype must have at least one Geolocation field type."),
                        indicator: "red"
                    });
                }
            });
        } else {
            frm.set_df_property("doctype_field", "options", []);
        }
    }

});
