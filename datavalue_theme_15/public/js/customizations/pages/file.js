frappe.ui.form.on("File", {
    onload: function (frm) {

    },
    refresh(frm) {
        let wrapper = frm.get_field("preview_html").$wrapper;
        let selected_doc = frm.selected_doc;
        let file_ext = (selected_doc.file_name) ? selected_doc.file_name.split('.').pop() : '';
        let is_viewable = (file_ext && file_ext.toLowerCase() == 'pdf') ? true : frappe.utils.is_image_file(frm.doc.file_url);
        frm.toggle_display("preview", is_viewable);
        frm.toggle_display("preview_html", is_viewable);
        console.log(frm)
        console.log('frm.selected_doc', frm.selected_doc)
        console.log('file_ext', file_ext)
        console.log('is_viewable', is_viewable)
        if (is_viewable) {
            if (file_ext) {
                if (file_ext.toLowerCase() == 'pdf') {
                    wrapper.html(`<div class="img_preview">
                                      <object style="background:#323639;" width="100%">
                                         <embed style="background:#323639;" width="100%" height="1190" src="${frm.doc.file_url}" type="application/pdf">
                                      </object>
			                      </div>`);
                } else if (frappe.utils.is_image_file(frm.doc.file_url)) {
                    wrapper.html(`<div class="img_preview">
			                        <img class="img-responsive" src="${frm.doc.file_url}">
			                      </div>`);
                } else {
                    wrapper.empty();
                }
            } else {
                wrapper.empty();
            }
        } else {
            wrapper.empty();
        }
    }
});
