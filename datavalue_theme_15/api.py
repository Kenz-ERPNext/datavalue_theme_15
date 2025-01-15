from __future__ import unicode_literals
import os, re, json
import frappe
from frappe.utils import flt, cint, get_time, make_filter_tuple, get_filter, add_to_date, cstr, get_timespan_date_range, nowdate, add_days, getdate, add_months, get_datetime
from frappe import _
from frappe.desk.reportview import get_filters_cond
from frappe.cache_manager import clear_user_cache
from six import string_types


@frappe.whitelist()
def get_module_name_from_doctype(doc_name, current_module=""):
    # frappe.msgprint("======"+str(doc_name))
    condition = ""
    if doc_name:
        if current_module:
            condition = "and  w.`name` = {current_module} ".format(current_module=current_module)

        list_od_dicts = frappe.db.sql("""
            select *
                    from (
                            select  w.`name` `module`,
                                 (select restrict_to_domain from `tabModule Def` where `name` = w.module ) restrict_to_domain
                                             from  tabWorkspace w
                                             inner join
                                                        `tabWorkspace Link` l
                                                        on w.`name` = l.parent
                                                         where link_to = '{doc_name}'
                                                          %s
                                )	T
        """.format(doc_name=doc_name), (condition), as_dict=True, debug=False)
        if list_od_dicts:
            return [{"module": list_od_dicts[0]["module"]}]
        else:
            list_od_dicts = frappe.db.sql("""
                select *
                        from (
                                select  w.`name` `module`,
                                     (select restrict_to_domain from `tabModule Def` where `name` = w.module ) restrict_to_domain
                                                 from  tabWorkspace w
                                                 inner join
                                                            `tabWorkspace Link` l
                                                            on w.`name` = l.parent
                                                             where link_to = '{doc_name}'
                                    )	T
            """.format(doc_name=doc_name), as_dict=True, debug=False)
        if list_od_dicts:
            return [{"module": list_od_dicts[0]["module"]}]


@frappe.whitelist()
def get_permitted_maps(dashboard_name):
    dashboard = frappe.get_doc("Dashboard", dashboard_name)
    return [map for map in dashboard.custom_maps if frappe.has_permission("Dashboard Map", doc=map.map)]


@frappe.whitelist()
def get_doctype_parent_module(doctype=''):
    # select * from `tabWorkspace Link` where type='Link' and link_to='Employee' order by idx DESC limit 1;
    resutl = frappe.db.sql(
        """select * from `tabWorkspace Link` where type='Link' and link_to='{doctype}' order by idx DESC limit 1""".format(doctype=doctype),
        as_dict=True)
    if (resutl and resutl[0]):
        return resutl[0].parent


@frappe.whitelist()
def change_language(language):
    frappe.db.set_value("User", frappe.session.user, "language", language)
    clear()
    return True


@frappe.whitelist()
def get_current_language():
    return frappe.db.get_value("User", frappe.session.user, "language")


@frappe.whitelist()
def get_company_logo():
    logo_path = ""
    current_company = frappe.defaults.get_user_default("company")
    if current_company:
        logo_path = frappe.db.get_value("Company", current_company, "company_logo")

    return logo_path


@frappe.whitelist(allow_guest=True)
def get_theme_settings():
    slideshow_photos = []
    settings_list = {}
    settings = frappe.db.sql("""
                       SELECT * FROM tabSingles WHERE doctype = 'Theme Settings';
    """, as_dict=True, debug=False)

    for setting in settings:
        settings_list[setting['field']] = setting['value']

    if (("background_type" in settings_list) and settings_list['background_type'] == 'Slideshow'):
        slideshow_photos = frappe.db.sql("""
                               SELECT `photo` FROM `tabSlideshow Photos` WHERE `parent` = 'Theme Settings';
            """, as_dict=True, debug=False)

    return {
        'enable_background': settings_list['enable_background'] if ("enable_background" in settings_list) else '',
        'background_photo': settings_list['background_photo'] if ("background_photo" in settings_list) else '',
        'background_type': settings_list['background_type'] if ("background_type" in settings_list) else '',
        'full_page_background': settings_list['full_page_background'] if ("full_page_background" in settings_list) else '',
        'transparent_background': settings_list['transparent_background'] if ("transparent_background" in settings_list) else '',
        'default_workspace': settings_list['default_workspace'] if ("default_workspace" in settings_list) else '',
        'slideshow_photos': slideshow_photos,
        'dark_view': settings_list['dark_view'] if ("dark_view" in settings_list) else '',
        'theme_color': settings_list['theme_color'] if ("theme_color" in settings_list) else '',
        'open_workspace_on_mobile_menu': settings_list['open_workspace_on_mobile_menu'] if ("open_workspace_on_mobile_menu" in settings_list) else '',
        'show_icon_label': settings_list['show_icon_label'] if ("show_icon_label" in settings_list) else '',
        'hide_icon_tooltip': settings_list['hide_icon_tooltip'] if ("hide_icon_tooltip" in settings_list) else '',
        'always_close_sub_menu': settings_list['always_close_sub_menu'] if ("always_close_sub_menu" in settings_list) else '',
        'loading_image': settings_list['loading_image'] if ("loading_image" in settings_list) else ''
    }


@frappe.whitelist()
def update_theme_settings(**data):
    data = frappe._dict(data)
    doc = frappe.get_doc("Theme Settings")
    doc.theme_color = data.theme_color
    doc.apply_on_menu = data.apply_on_menu
    doc.apply_on_dashboard = data.apply_on_dashboard
    doc.apply_on_workspace = data.apply_on_workspace
    doc.apply_on_navbar = data.apply_on_navbar
    doc.save(ignore_permissions=True)
    return doc


@frappe.whitelist()
def get_events(start=getdate(), end=getdate().year, user=None, for_reminder=False, filters=None):
    end = str(getdate().year) + "-12-31"
    if not user:
        user = frappe.session.user

    if isinstance(filters, string_types):
        filters = json.loads(filters)

    filter_condition = get_filters_cond('Event', filters, [])

    tables = ["`tabEvent`"]
    if "`tabEvent Participants`" in filter_condition:
        tables.append("`tabEvent Participants`")

    events = frappe.db.sql("""
        SELECT `tabEvent`.name,
                `tabEvent`.subject,
                `tabEvent`.description,
                `tabEvent`.color,
                `tabEvent`.starts_on,
                `tabEvent`.ends_on,
                `tabEvent`.owner,
                `tabEvent`.all_day,
                `tabEvent`.event_type,
                `tabEvent`.repeat_this_event,
                `tabEvent`.repeat_on,
                `tabEvent`.repeat_till,
                `tabEvent`.monday,
                `tabEvent`.tuesday,
                `tabEvent`.wednesday,
                `tabEvent`.thursday,
                `tabEvent`.friday,
                `tabEvent`.saturday,
                `tabEvent`.sunday
        FROM {tables}
        WHERE (
                (
                    (date(`tabEvent`.starts_on) BETWEEN date(%(start)s) AND date(%(end)s))
                    OR (date(`tabEvent`.ends_on) BETWEEN date(%(start)s) AND date(%(end)s))
                    OR (
                        date(`tabEvent`.starts_on) <= date(%(start)s)
                        AND date(`tabEvent`.ends_on) >= date(%(end)s)
                    )
                )
                OR (
                    date(`tabEvent`.starts_on) <= date(%(start)s)
                    AND `tabEvent`.repeat_this_event=1
                    AND coalesce(`tabEvent`.repeat_till, '3000-01-01') > date(%(start)s)
                )
            )
        {reminder_condition}
        {filter_condition}
        AND (
                `tabEvent`.event_type='Public'
                OR `tabEvent`.owner=%(user)s
                OR EXISTS(
                    SELECT `tabDocShare`.name
                    FROM `tabDocShare`
                    WHERE `tabDocShare`.share_doctype='Event'
                        AND `tabDocShare`.share_name=`tabEvent`.name
                        AND `tabDocShare`.user=%(user)s
                )
            )
        AND `tabEvent`.status='Open'
        ORDER BY `tabEvent`.starts_on""".format(
        tables=", ".join(tables),
        filter_condition=filter_condition,
        reminder_condition="AND coalesce(`tabEvent`.send_reminder, 0)=1" if for_reminder else ""
    ), {
        "start": start,
        "end": end,
        "user": user,
    }, as_dict=1)

    return events


@frappe.whitelist()
def get_workspace_sidebar_items():
    """Get list of sidebar items for desk"""
    has_access = "Workspace Manager" in frappe.get_roles()

    # don't get domain restricted pages
    blocked_modules = frappe.get_cached_doc("User", frappe.session.user).get_blocked_modules()
    blocked_modules.append("Dummy Module")

    # adding None to allowed_domains to include pages without domain restriction
    allowed_domains = [None, *frappe.get_active_domains()]

    filters = {
        "restrict_to_domain": ["in", allowed_domains],
        "module": ["not in", blocked_modules],
    }

    if has_access:
        filters = []

    # pages sorted based on sequence id
    order_by = "sequence_id asc"
    fields = [
        "name",
        "title",
        "custom_default_dashboard",
        "custom_menu_title",
        "for_user",
        "parent_page",
        "content",
        "public",
        "module",
        "icon",
        "indicator_color",
        "is_hidden",
    ]
    all_pages = frappe.get_all(
        "Workspace", fields=fields, filters=filters, order_by=order_by, ignore_permissions=True
    )
    pages = []
    private_pages = []

    # Filter Page based on Permission
    for page in all_pages:
        try:
            workspace = Workspace(page, True)
            if has_access or workspace.is_permitted():
                if page.public and (has_access or not page.is_hidden) and page.title != "Welcome Workspace":
                    pages.append(page)
                elif page.for_user == frappe.session.user:
                    private_pages.append(page)
                page["label"] = _(page.get("name"))
        except frappe.PermissionError:
            pass
    if private_pages:
        pages.extend(private_pages)

    if len(pages) == 0:
        pages = [frappe.get_doc("Workspace", "Welcome Workspace").as_dict()]
        pages[0]["label"] = _("Welcome Workspace")

    return {
        "pages": pages,
        "has_access": has_access,
        "has_create_access": frappe.has_permission(doctype="Workspace", ptype="create"),
    }


@frappe.whitelist()
def update_menu_modules(modules):
    modules_list = json.loads(modules)
    for module in modules_list:
        if frappe.db.exists("Workspace", module["name"]):
            if (module["_is_deleted"] == 'true'):
                frappe.delete_doc("Workspace", module["name"], force=True)
            else:
                frappe.db.set_value("Workspace", module["name"], {
                    "custom_menu_title": module['title'],
                    "custom_default_dashboard": module["custom_default_dashboard"] if module["custom_default_dashboard"] else '',
                    "custom_open_dashboard": module["custom_open_dashboard"] if module["custom_open_dashboard"] else 0,
                    "icon": module["icon"],
                    "sequence_id": int(module["sequence_id"])
                })
        else:
            if (module["_is_new"] == 'true'):
                workspace = frappe.new_doc("Workspace")
                workspace.title = module["title"]
                workspace.custom_menu_title = module["title"]
                workspace.custom_default_dashboard = module["custom_default_dashboard"] if module["custom_default_dashboard"] else ''
                workspace.custom_open_dashboard = module["custom_open_dashboard"] if module["custom_open_dashboard"] else 0
                workspace.icon = module["icon"]
                workspace.content = module["content"]
                workspace.label = module["label"]
                workspace.sequence_id = int(module["sequence_id"])
                workspace.indicator_color = ""
                workspace.for_user = ""
                workspace.public = 1
                workspace.save()

    return True


@frappe.whitelist()
def get_form_cards(doctype):
    cards_list = []
    cards = frappe.db.get_all("Form Number Card", filters={"doctype_form": doctype}, fields=["name", "idx", "number_card_name", "doctype_form", "label"], order_by="idx asc")
    if cards:
        for card in cards:
            card.card_data = frappe.db.get_value("Number Card", {"name": card.number_card_name}, ["*"], as_dict=True)
            cards_list.append(card)
    return cards_list


@frappe.whitelist()
def add_form_card(number_card_name, doctype_form, label=''):
    new_doc = frappe.new_doc("Form Number Card")
    new_doc.number_card_name = number_card_name
    new_doc.doctype_form = doctype_form
    new_doc.label = label
    new_doc.save()
    frappe.db.commit()
    return new_doc


@frappe.whitelist()
def update_form_card(cards):
    cards_list = json.loads(cards)
    for card in cards_list:
        if frappe.db.exists("Form Number Card", card["name"]):
            if (card["_is_deleted"] == 'true'):
                frappe.delete_doc("Form Number Card", card["name"], force=True)
            else:
                frappe.db.set_value("Form Number Card", card["name"], {
                    "idx": card["idx"],
                    "number_card_name": card['number_card_name'],
                    "label": card["label"]
                })

    return True


@frappe.whitelist()
def get_report_cards(report_name):
    cards_list = []
    if(report_name):
        cards = frappe.db.get_all("Report Number Card", filters={"report_name": report_name}, fields=["name", "idx", "number_card_name", "report_name", "label"], order_by="idx asc")
        if cards:
            for card in cards:
                card.card_data = frappe.db.get_value("Number Card", {"name": card.number_card_name}, ["*"], as_dict=True)
                cards_list.append(card)
    return cards_list


@frappe.whitelist()
def add_report_card(number_card_name, report_name, label=''):
    new_doc = frappe.new_doc("Report Number Card")
    new_doc.number_card_name = number_card_name
    new_doc.report_name = report_name
    new_doc.label = label
    new_doc.save()
    frappe.db.commit()
    return new_doc


@frappe.whitelist()
def update_report_card(cards):
    cards_list = json.loads(cards)
    for card in cards_list:
        if frappe.db.exists("Report Number Card", card["name"]):
            if (card["_is_deleted"] == 'true'):
                frappe.delete_doc("Report Number Card", card["name"], force=True)
            else:
                frappe.db.set_value("Report Number Card", card["name"], {
                    "idx": card["idx"],
                    "number_card_name": card['number_card_name'],
                    "label": card["label"]
                })

    return True


def clear():
    frappe.local.session_obj.update(force=True)
    frappe.local.db.commit()
    clear_user_cache(frappe.session.user)
    frappe.response['message'] = _("Cache Cleared")
