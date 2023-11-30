(function ($) {
    if (!$.fn.imwebdatepicker) {
        throw new Error("imweb-datepicker-modal requires imweb-datepicker module");
    }

    const createSelector = (prefix) => {
        return `_${prefix}-modal-${new Date().valueOf()}`;
    };

    const createElements = (self) => {
        const { selector } = self;

        const createRoot = () => {
            const root = document.createElement("div");

            root.role = "dialog";

            root.classList.add(selector.root);
            root.classList.add("imweb-datepicker-modal");

            return root;
        };

        const createLayout = () => {
            const layout = document.createElement("div");

            layout.classList.add(selector.layout);
            layout.classList.add("layout-container");

            return layout;
        };

        const createContents = () => {
            const contents = document.createElement("div");

            contents.classList.add(selector.contents);
            contents.classList.add("contents-container");

            return contents;
        };

        const root = createRoot();
        const layout = createLayout();
        const contents = createContents();

        layout.appendChild(contents);
        root.appendChild(layout);

        return { root, contents };
    };

    const parseOptions = (self, options) => {
        const { container, show, ...others } = options;

        return {
            modal: { container, show },
            datepicker: {
                ...others,
                onConfirm: function (start, end, type) {
                    const done = () => closeModal(self.elements.root);

                    handleConfirm(self, start, end, type, done, others.onConfirm);
                },
                onCancel: function (type) {
                    handleCancel(self, type, others.onCancel);
                },
            },
        };
    };

    const closeModal = ($el) => {
        $($el).modal("hide");
    };

    const handleConfirm = (self, start, end, type, done, onConfirm) => {
        if (onConfirm) {
            onConfirm(done, start, end, type);
        }
    };

    const handleCancel = (self, type, onCancel) => {
        const { elements } = self;

        closeModal(elements.root);

        if (onCancel) {
            onCancel(type);
        }
    };

    function ImwebDatePickerModal(options) {
        this.options = null;
        this.container = null;
        this.selector = null;
        this.elements = null;
        this.datepicker = null;

        this.init(options);

        const { show } = this.options;

        if (show) {
            this.show();
        }
    }

    ImwebDatePickerModal.prototype.init = function (options) {
        const { modal, datepicker } = parseOptions(this, options);

        this.options = modal;
        this.datepicker = {
            options: datepicker,
        };

        this.container = modal.container || document.body;

        this.selector = {
            root: createSelector("imweb-datepicker"),
            layout: createSelector("imweb-datepicker-layout"),
            contents: createSelector("imweb-datepicker-contents"),
        };

        const elements = createElements(this);

        this.elements = {
            root: elements.root,
            layout: elements.layout,
            contents: elements.contents,
        };
    };

    ImwebDatePickerModal.prototype.show = function () {
        const { container, elements, datepicker } = this;

        container.appendChild(elements.root);

        $(elements.root).modal("show");

        this.attachEvents();

        $(elements.contents).imwebdatepicker(datepicker.options);

        datepicker.instance = $(elements.contents).data($.fn.imwebdatepicker.instanceKey);
    };

    ImwebDatePickerModal.prototype.destroy = function () {
        const { container, elements } = this;

        this.detachEvents();
        this.datepicker.instance.destroy();

        container.removeChild(elements.root);
    };

    ImwebDatePickerModal.prototype.attachEvents = function () {
        const { elements } = this;

        const self = this;

        $(elements.root).on("hidden.bs.modal", function () {
            self.destroy();
        });
    };

    ImwebDatePickerModal.prototype.detachEvents = function () {
        const { elements } = this;

        $(elements.root).off("hidden.bs.modal");
    };

    ImwebDatePickerModal.DEFAULT_OPTIONS = {
        ...$.fn.imwebdatepicker.Constructor.DEFAULT_OPTIONS,
        container: null,
        show: true,
    };

    function Plugin(optionsOrCommand) {
        const options = (typeof optionsOrCommand === "object" && optionsOrCommand) || {};
        const command = typeof optionsOrCommand === "string" && optionsOrCommand;

        const instance = new ImwebDatePickerModal({
            ...ImwebDatePickerModal.DEFAULT_OPTIONS,
            ...options,
        });

        if (command) {
            instance[command]();
        }

        return instance;
    }

    const old = $.imwebdatepickerModal;

    $.imwebdatepickerModal = Plugin;
    $.imwebdatepickerModal.Constructor = ImwebDatePickerModal;

    $.imwebdatepickerModal.noConflict = function () {
        $.imwebdatepickerModal = old;

        return this;
    };
})(window.jQuery);
