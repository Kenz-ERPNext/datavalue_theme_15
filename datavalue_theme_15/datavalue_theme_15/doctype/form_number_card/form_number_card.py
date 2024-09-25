# Copyright (c) 2024, Abdo Hamoud and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class FormNumberCard(Document):
    def validate(self):
        if frappe.db.exists(self.doctype, {
            'number_card_name': self.number_card_name,
            'doctype_form': self.doctype_form,
            'name': ('!=', self.name)
        }):
            frappe.throw(frappe._("This card already exist in doctype form."))
    # def after_doctype_insert():
    #     frappe.db.add_unique("Form Number Card", ("number_card_name", "doctype_form"))
