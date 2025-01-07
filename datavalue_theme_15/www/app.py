# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: MIT. See LICENSE
from dataclasses import fields

no_cache = 1

import json
import os
import re
import secrets
import frappe
import frappe.sessions
from frappe import _
from frappe.utils.jinja_globals import is_rtl
from frappe.model.utils.user_settings import get_user_settings, update_user_settings

SCRIPT_TAG_PATTERN = re.compile(r"\<script[^<]*\</script\>")
CLOSING_SCRIPT_TAG_PATTERN = re.compile(r"</script\>")


def get_context(context):
    if frappe.session.user == "Guest":
        frappe.throw(_("Log in to access this page."), frappe.PermissionError)
    elif (
            frappe.db.get_value("User", frappe.session.user, "user_type", order_by=None) == "Website User"
    ):
        frappe.throw(_("You are not permitted to access this page."), frappe.PermissionError)

    hooks = frappe.get_hooks()
    try:
        boot = frappe.sessions.get()
    except Exception as e:
        boot = frappe._dict(status="failed", error=str(e))
        print(frappe.get_traceback())

    # this needs commit
    csrf_token = frappe.sessions.get_csrf_token()

    boot_json = frappe.as_json(boot, indent=None, separators=(",", ":"))

    # remove script tags from boot
    boot_json = SCRIPT_TAG_PATTERN.sub("", boot_json)

    # get theme settings
    frappe.db.commit()

    theme_settings_list = {}

    theme_settings = frappe.db.sql(""" SELECT * FROM tabSingles WHERE doctype = 'Theme Settings'; """, as_dict=True)
    for theme_setting in theme_settings:
        theme_settings_list[theme_setting['field']] = theme_setting['value']
        theme_settings_list['hide_layout_pages'] = frappe.db.get_all('Theme Settings Hide Layout Pages', filters={'parent': 'Theme Settings'}, fields=["name", "page_name"], pluck="page_name")

    # TODO: Find better fix
    boot_json = CLOSING_SCRIPT_TAG_PATTERN.sub("", boot_json)
    boot_json = json.dumps(boot_json)
    desk_theme = frappe.db.get_value("User", frappe.session.user, "desk_theme")
    theme = 'light'
    if (desk_theme == 'Dark'):
        theme = 'dark'

    # Theme Color By User
    user_settings = json.loads(get_user_settings('User'))
    theme_color = (theme_settings_list['theme_color'] or 'Blue') if 'theme_color' in theme_settings_list else 'Blue';
    if ('theme_color' in user_settings):
        theme_color = user_settings['theme_color']

    include_icons = hooks.get("app_include_icons", [])
    frappe.local.preload_assets["icons"].extend(include_icons)

    context.update(
        {
            "no_cache": 1,
            "app_version": get_first_item(hooks.version),
            "build_version": frappe.utils.get_build_version(),
            "build_version_dev": secrets.randbits(50),
            "include_js": hooks["app_include_js"],
            "include_css": hooks["app_include_css"],
            "include_icons": include_icons,
            "layout_direction": "rtl" if is_rtl() else "ltr",
            "lang": frappe.local.lang,
            "sounds": hooks["sounds"],
            "boot": boot if context.get("for_mobile") else boot_json,
            "desk_theme": boot.get("desk_theme") or "Light",
            "csrf_token": csrf_token,
            "google_analytics_id": frappe.conf.get("google_analytics_id"),
            "google_analytics_anonymize_ip": frappe.conf.get("google_analytics_anonymize_ip"),
            "mixpanel_id": frappe.conf.get("mixpanel_id"),
            "theme_settings": theme_settings_list,
            "default_workspace": frappe.db.get_value("User", frappe.session.user, 'default_workspace'),
            "theme_color": (theme_color),
            "theme_color_name": (theme_color).replace(' ', '-').lower(),
            "theme_color_on_navbar": 'layout-navbar-color-style' if ('apply_on_navbar' in theme_settings_list and theme_settings_list['apply_on_navbar'] == '1') else '',
            "apply_on_menu": 'layout-menu-color-style' if ('apply_on_menu' in theme_settings_list and theme_settings_list['apply_on_menu'] == '1') else '',
            "apply_on_dashboard": 'layout-dashboard-color-style' if ('apply_on_dashboard' in theme_settings_list and theme_settings_list['apply_on_dashboard'] == '1') else '',
            "apply_on_workspace": 'layout-workspace-color-style' if ('apply_on_workspace' in theme_settings_list and theme_settings_list['apply_on_workspace'] == '1') else '',
            "dark_theme": theme
        }
    )

    return context


def get_first_item(array):
    if isinstance(array, list) and len(array) > 0:
        return array[0]
    else:
        return ''


@frappe.whitelist()
def get_desk_assets(build_version):
    """Get desk assets to be loaded for mobile app"""
    data = get_context({"for_mobile": True})
    assets = [{"type": "js", "data": ""}, {"type": "css", "data": ""}]

    if build_version != data["build_version"]:
        # new build, send assets
        for path in data["include_js"]:
            # assets path shouldn't start with /
            # as it points to different location altogether
            if path.startswith("/assets/"):
                path = path.replace("/assets/", "assets/")
            try:
                with open(os.path.join(frappe.local.sites_path, path)) as f:
                    assets[0]["data"] = assets[0]["data"] + "\n" + frappe.safe_decode(f.read(), "utf-8")
            except OSError:
                pass

        for path in data["include_css"]:
            if path.startswith("/assets/"):
                path = path.replace("/assets/", "assets/")
            try:
                with open(os.path.join(frappe.local.sites_path, path)) as f:
                    assets[1]["data"] = assets[1]["data"] + "\n" + frappe.safe_decode(f.read(), "utf-8")
            except OSError:
                pass

    return {"build_version": data["build_version"], "boot": data["boot"], "assets": assets}
