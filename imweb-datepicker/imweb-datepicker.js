(function ($) {
    const MODULE_NAME = "imweb-datepicker.js";

    const dependencies = [{ name: "vanilla-calendar.js", module: window.VanillaCalendar }];

    const checkDependencies = () => {
        dependencies.forEach(({ name, module }) => {
            if (typeof module === "undefined") {
                throw new Error(`${MODULE_NAME} requires ${name}`);
            }
        });
    };

    checkDependencies();

    // * ==========================
    // * Utils
    // * ==========================

    const Utils = (function () {
        const isObject = (obj) => {
            return obj !== null && !(obj instanceof Array) && typeof obj === "object";
        };

        const merge = (target, source) => {
            if (target === source || !source) {
                return target;
            }

            const recursive = (target, source, obj) => {
                const keys = Object.keys(target);

                for (let key = keys.shift(); key; key = keys.shift()) {
                    const nextSource = source && source[key];

                    if (isObject(target[key])) {
                        obj[key] = {};

                        recursive(target[key], nextSource, obj[key]);
                    } else {
                        obj[key] = nextSource ?? target[key];
                    }
                }

                return obj;
            };

            return recursive(target, source, {});
        };

        return { merge };
    })();

    // * ==========================
    // * dayInstance
    // * ==========================

    const dayInstance = (function () {
        const REGEX = {
            DATE: /^\d{4}([-/]\d{2}){0,2}$/,
            DATETIME: /^\d{4}([-/]\d{2}){2}\s\d{2}(:\d{2}){1,2}$/,
        };

        const TYPE = {
            INIT: "init",
            DAY: "day",
            INVALID: "invalid",
            DATE: "date",
            STRING: "string",
        };

        const UNIT = {
            DATE: "date",
            WEEK: "week",
            MONTH: "month",
            YEAR: "year",
        };

        const FORMAT = {
            DATE: "date",
            MONTH: "month",
            YEAR: "year",
        };

        const INVALID_DATE = "Invalid Date";

        const WEEK = 7;

        const isDay = (v) => v instanceof Day;

        const isDate = (v) => v instanceof Date;

        const isDateNull = (v) => v === null;

        const isInvalidDate = (v) => isDate(v) && v.toString() === INVALID_DATE;

        const isDateString = (v) => REGEX.DATE.test(v);

        const isDatetimeString = (v) => isDateString(v) && REGEX.DATETIME.test(v);

        const isFormat = (v) => Object.values(FORMAT).includes(v);

        const newInvalidDate = () => new Date(NaN);

        const pad = (v) => `0${v}`.substring(v.toString().length - 1);

        const format = (v, f) => {
            if (isDateNull(v) || isInvalidDate(v)) {
                return INVALID_DATE;
            }

            const d = new Date(v);

            const year = d.getFullYear().toString();
            const month = pad(d.getMonth() + 1);
            const date = pad(d.getDate());

            const res = [year];

            if (f === FORMAT.MONTH || f === FORMAT.DATE) {
                res.push(month);
            }

            if (f === FORMAT.DATE) {
                res.push(date);
            }

            return res.join("-");
        };

        const parse = (v) => {
            const res = { type: "", arg: null, date: null, org: null };

            if (v === undefined) {
                res.type = TYPE.INIT;
                res.date = new Date();
                res.arg = undefined;
                res.org = undefined;

                return res;
            }

            if (isDay(v)) {
                res.type = TYPE.DAY;
                res.date = v.date();
                res.arg = v.arg;
                res.org = v;

                res.date.setMilliseconds(0);
                res.date.setSeconds(0);
                res.date.setMinutes(0);
                res.date.setHours(0);

                return res;
            }

            if (isDateNull(v) || isInvalidDate(v)) {
                res.type = TYPE.INVALID;
                res.date = newInvalidDate();
                res.arg = null;
                res.org = v;

                return res;
            }

            if (isDate(v)) {
                res.type = TYPE.DATE;
                res.date = new Date(v);
                res.arg = format(v);
                res.org = v;

                return res;
            }

            if (isDateString(v) || isDatetimeString(v)) {
                res.type = TYPE.STRING;
                res.date = new Date(v);
                res.arg = format(res.date);
                res.org = v;

                res.date.setMilliseconds(0);
                res.date.setSeconds(0);
                res.date.setMinutes(0);
                res.date.setHours(0);

                return res;
            }

            res.type = TYPE.INVALID;
            res.date = newInvalidDate();
            res.arg = v;
            res.org = v;

            return res;
        };

        function wrap(day) {
            if (isDay(day)) {
                return day.clone();
            }

            return new Day(day);
        }

        function Day(day) {
            const { type, arg, date, org } = parse(day);

            this.type = type;
            this.arg = arg;
            this.date = date;
            this.org = org;
        }

        Day.prototype.add = function (offset, unit) {
            const d = this.toDate();

            const safeOffset = offset ?? 0;

            switch (unit) {
                case UNIT.DATE:
                    d.setDate(d.getDate() + safeOffset);
                    break;
                case UNIT.WEEK:
                    d.setDate(d.getDate() + safeOffset * WEEK);
                    break;
                case UNIT.MONTH:
                    d.setMonth(d.getMonth() + safeOffset);
                    break;
                case UNIT.YEAR:
                    d.setFullYear(d.getFullYear() + safeOffset);
                    break;
            }

            return wrap(d);
        };

        Day.prototype.firstOf = function (unit) {
            const d = this.toDate();

            switch (unit) {
                case UNIT.WEEK:
                    d.setDate(d.getDate() - d.getDay());
                    break;
                case UNIT.MONTH:
                    d.setDate(1);
                    break;
                case UNIT.YEAR:
                    d.setMonth(0);
                    d.setDate(1);
                    break;
            }

            return wrap(d);
        };

        Day.prototype.lastOf = function (unit) {
            const d = this.firstOf(unit).toDate();

            switch (unit) {
                case UNIT.WEEK:
                    d.setDate(d.getDate() + 6);
                    break;
                case UNIT.MONTH:
                    d.setMonth(d.getMonth() + 1);
                    d.setDate(0);
                    break;
                case UNIT.YEAR:
                    d.setMonth(11);
                    d.setDate(31);
                    break;
            }

            return wrap(d);
        };

        Day.prototype.toDate = function () {
            const d = new Date(this.date);

            d.setMilliseconds(0);
            d.setSeconds(0);
            d.setMinutes(0);
            d.setHours(0);

            return d;
        };

        Day.prototype.toString = function (arg) {
            const f = isFormat(arg) ? arg : FORMAT.DATE;

            return format(this.date, f);
        };

        Day.prototype.clone = function () {
            const { date } = this;

            return wrap(date);
        };

        wrap.unit = UNIT;
        wrap.isInvalidDate = isInvalidDate;

        return wrap;
    })();

    // * ==========================
    // * presetInstance
    // * ==========================

    const presetInstance = (function () {
        const TYPE = {
            DATE: "date",
            MONTH: "month",
            YEAR: "year",
        };

        const DATE_PRESET = {
            CURRENT: "current",
            WEEK: "week",
            MONTH: "month",
            YEAR: "year",
        };

        const MONTH_PRESET = {
            CURRENT: "current",
        };

        const YEAR_PRESET = {
            CURRENT: "current",
        };

        function increase() {
            let id = 0;

            return () => (id = id + 1);
        }

        const next = increase();

        const isContainsValue = (v, obj) => Object.values(obj).includes(v);

        const isNumber = (v) => /^-?\d+$/.test(v);

        const getDefaultPreset = (type) => {
            return {
                [TYPE.DATE]: DATE_PRESET.CURRENT,
                [TYPE.MONTH]: MONTH_PRESET.CURRENT,
                [TYPE.YEAR]: YEAR_PRESET.CURRENT,
            }[type];
        };

        const getPresets = (type) => {
            return {
                [TYPE.DATE]: DATE_PRESET,
                [TYPE.MONTH]: MONTH_PRESET,
                [TYPE.YEAR]: YEAR_PRESET,
            }[type];
        };

        const getDayUnit = (type) => {
            return {
                [TYPE.DATE]: dayInstance.unit.DATE,
                [TYPE.MONTH]: dayInstance.unit.MONTH,
                [TYPE.YEAR]: dayInstance.unit.YEAR,
            }[type];
        };

        const getDayInstanceArg = (type, preset) => {
            return {
                [TYPE.DATE]: preset === DATE_PRESET.CURRENT ? "date" : preset,
                [TYPE.MONTH]: preset === MONTH_PRESET.CURRENT ? "date" : preset,
                [TYPE.YEAR]: preset === YEAR_PRESET.CURRENT ? "date" : preset,
            }[type];
        };

        const toString = (type, start, end) => {
            const defaultPreset = getDefaultPreset(type);
            const presets = getPresets(type);
            const unit = getDayUnit(type);

            const startPreset = start ?? end ?? defaultPreset;
            const endPreset = end ?? startPreset ?? defaultPreset;

            const convert = (preset, isFirstOf) => {
                if (isContainsValue(preset, presets)) {
                    const m = dayInstance();
                    const someOf = isFirstOf ? m.firstOf : m.lastOf;
                    const arg = getDayInstanceArg(type, preset);

                    return someOf.call(m, arg).toString(unit);
                }

                if (isNumber(preset)) {
                    return dayInstance().add(preset, unit).toString(unit);
                }

                return dayInstance(preset).toString(unit);
            };

            return [convert(startPreset, true), convert(endPreset, false)];
        };

        function wrap(type) {
            const arg = isContainsValue(type, TYPE) ? type : TYPE.DATE;

            return new Preset(arg);
        }

        function Preset(type) {
            this.type = type;
            this.items = [];
        }

        Preset.prototype.add = function (item) {
            const { type } = this;

            const label = item.label;
            const originStart = item.start;
            const originEnd = item.end;

            const [start, end] = toString(type, originStart, originEnd);

            this.items.push({
                id: next(),
                label,
                originStart,
                originEnd,
                start,
                end,
            });
        };

        Preset.prototype.delete = function (id) {
            this.items = this.items.filter((item) => item.id !== id);
        };

        Preset.prototype.clear = function () {
            this.items = [];
        };

        wrap.type = TYPE;

        return wrap;
    })();

    // * ==========================
    // * EventManager
    // * ==========================

    const eventManagerInstance = (function () {
        const attachOrDetachEvents = (root, selector, listeners, isAttach) => {
            const selectorElement = root.querySelector(selector) ?? document;

            Object.keys(listeners).forEach((selector) => {
                const elements = selectorElement.querySelectorAll(selector);
                const events = listeners[selector];

                elements.forEach((element) => {
                    events.forEach(({ event, listener }) => {
                        if (isAttach) {
                            element.addEventListener(event, listener);
                        } else {
                            element.removeEventListener(event, listener);
                        }
                    });
                });
            });
        };

        function wrap(root, selector) {
            return new EventManager(root, selector);
        }

        function EventManager(root, selector) {
            this.root = root;
            this.selector = selector;
            this.listeners = {};
        }

        EventManager.prototype.registerEventListener = function ({ selector, event, listener }) {
            const { listeners } = this;

            const events = listeners[selector] ?? [];

            listeners[selector] = events;

            listeners[selector].push({ event, listener });
        };

        EventManager.prototype.clearEventListener = function (selector) {
            const { listeners } = this;

            listeners[selector] = [];
        };

        EventManager.prototype.attachEvents = function () {
            const { root, selector, listeners } = this;

            attachOrDetachEvents(root, selector, listeners, true);
        };

        EventManager.prototype.detachEvents = function () {
            const { root, selector, listeners } = this;

            attachOrDetachEvents(root, selector, listeners, false);
        };

        return wrap;
    })();

    // * ==========================
    // * DatePickerLayout
    // * ==========================

    const datepickerLayout = (function () {
        const TYPE = {
            DATE: "date",
            MONTH: "month",
            YEAR: "year",
        };

        const REGEX = {
            CHUNK: {
                PRESET: /<#Preset\s\/>/,
                TYPE: /<#Type\s\/>/,
                DISPLAY: /<#Display\s\/>/,
                BUTTON: /<#Button\s\/>/,
            },
        };

        const SELECTOR = {
            PRESET: {
                CONTAINER: "_preset-container",
                PRESET_BUTTON: "_preset-preset-button",
            },
            ACTION: {
                TYPE_BUTTON: {
                    CONTAINER: "_action-type-button-container",
                    SELF: "_action-type-button",
                    ACTIVE: "datepicker-button--primary",
                    INACTIVE: "datepicker-button--outlined",
                },
            },
            LIBRARY: {
                CONTAINER: "_library-container",
            },
            DISPLAY: {
                CONTAINER: "_display-container",
                START: "_display-start",
                END: "_display-end",
            },
            BUTTON: {
                CONTAINER: "_button-container",
                CONFIRM_BUTTON: {
                    SELF: "_button-confirm-button",
                    ACTIVE: "datepicker-button--primary",
                    INACTIVE: "datepicker-button--disabled",
                },
                CANCEL_BUTTON: "_button-cancel-button",
                RESET_BUTTON: "_button-reset-button",
            },
        };

        const ACTIONS = [
            { label: "일별", value: TYPE.DATE },
            { label: "월별", value: TYPE.MONTH },
            { label: "년도별", value: TYPE.YEAR },
        ];

        const LAYOUT_HTML = `
            <div class="imweb-datepicker">
                <#Preset />
                <div class="action-container">
                    <#Type />
                </div>
                <div class="${SELECTOR.LIBRARY.CONTAINER} library-container"></div>
                <div class="footer-container">
                    <#Display />
                    <div class="${SELECTOR.BUTTON.CONTAINER} button-container">
                        <div class="button-group">
                            <button class="${SELECTOR.BUTTON.RESET_BUTTON} datepicker-button datepicker-button--icon datepicker-button--secondary">
                                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 10C2 10 4.00498 7.26822 5.63384 5.63824C7.26269 4.00827 9.5136 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.89691 21 4.43511 18.2543 3.35177 14.5M2 10V4M2 10H8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                <span>다시 선택</span>
                            </button>
                        </div>
                        <div class="button-group">
                            <button
                                type="button"
                                class="${SELECTOR.BUTTON.CANCEL_BUTTON} datepicker-button datepicker-button--secondary"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                class="${SELECTOR.BUTTON.CONFIRM_BUTTON.SELF} datepicker-button"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const getPresets = (type) => {
            return {
                [TYPE.DATE]: [
                    { label: "오늘", start: "current", end: "current" },
                    { label: "어제", start: -1, end: -1 },
                    { label: "이번 주", start: "week", end: "current" },
                    { label: "최근 7일 (오늘 제외)", start: -7, end: -1 },
                    { label: "이번 달", start: "month", end: "current" },
                    { label: "최근 30일 (오늘 제외)", start: -30, end: -1 },
                ],
                [TYPE.MONTH]: [{ label: "이번 달", start: "current", end: "current" }],
                [TYPE.YEAR]: [{ label: "이번 년도", start: "current", end: "current" }],
            }[type];
        };

        const getPresetInstanaceType = (type) => {
            return {
                [TYPE.DATE]: presetInstance.type.DATE,
                [TYPE.MONTH]: presetInstance.type.MONTH,
                [TYPE.YEAR]: presetInstance.type.YEAR,
            }[type];
        };

        const getDisplayOptions = (type) => {
            return {
                [TYPE.DATE]: { start: "시작일", end: "종료일" },
                [TYPE.MONTH]: { start: "시작월", end: "종료월" },
                [TYPE.YEAR]: { start: "시작년도", end: "종료년도" },
            }[type];
        };

        const presetRenderer = (root) => ({
            container: function () {
                return root.querySelector(`.${SELECTOR.PRESET.CONTAINER}`);
            },
            children: function (type) {
                const instance = presetInstance(getPresetInstanaceType(type));
                const presets = getPresets(type);

                presets.forEach((item) => instance.add(item));

                return instance.items
                    .map((item) => {
                        return `
                            <button
                                type="button"
                                class="${SELECTOR.PRESET.PRESET_BUTTON} datepicker-button datepicker-button--secondary"
                                data-id="${item.id}"
                                data-origin-start="${item.originStart}"
                                data-origin-end="${item.originEnd}"
                                data-start="${item.start}"
                                data-end="${item.end}"
                            >
                                ${item.label}
                            </button>
                        `;
                    })
                    .join("");
            },
            update: function (type) {
                const container = this.container();
                const children = this.children(type);

                for (; container.firstChild; ) {
                    container.removeChild(container.firstChild);
                }

                container.innerHTML = children;
            },
            html: function (type) {
                return `
                    <div class="${SELECTOR.PRESET.CONTAINER} preset-container">
                        ${this.children(type)}
                    </div>
                `;
            },
        });

        const typeButtonRenderer = (root) => ({
            container: function () {
                return root.querySelector(`.${SELECTOR.ACTION.TYPE_BUTTON.CONTAINER}`);
            },
            children: function (type) {
                return ACTIONS.map(({ label, value }) => {
                    const isSelected = type === value;

                    const classnames = [SELECTOR.ACTION.TYPE_BUTTON.SELF, "datepicker-button"];

                    classnames.push(
                        isSelected
                            ? SELECTOR.ACTION.TYPE_BUTTON.ACTIVE
                            : SELECTOR.ACTION.TYPE_BUTTON.INACTIVE
                    );

                    return `
                        <button
                            type="button"
                            class="${classnames.join(" ")}"
                            data-type="${value}"
                        >
                            ${label}
                        </button>
                    `;
                }).join("");
            },
            update: function (type) {
                const container = this.container();
                const children = this.children(type);

                container.textContent = "";
                container.innerHTML = children;
            },
            html: function (type) {
                const classnames = `${SELECTOR.ACTION.TYPE_BUTTON.CONTAINER} type-button-container button-group`;

                return `
                    <div class="${classnames}">
                        ${this.children(type)}
                    </div>
                `;
            },
        });

        const displayRenderer = (root) => ({
            container: function () {
                return root.querySelector(`.${SELECTOR.DISPLAY.CONTAINER}`);
            },
            children: function (type, start, end) {
                const options = getDisplayOptions(type);

                return `
                    <div class="${SELECTOR.DISPLAY.START} display display--selected">
                        <span class="display-label">${options.start}</span>
                        <span class="display-time">${start || "선택하세요"}</span>
                    </div>
                    <div class="${SELECTOR.DISPLAY.END} display display--selected">
                        <span class="display-label">${options.end}</span>
                        <span class="display-time">${end || "선택하세요"}</span>
                    </div> 
                `;
            },
            update: function (type, start, end) {
                const container = this.container();
                const children = this.children(type, start, end);

                container.textContent = "";
                container.innerHTML = children;
            },
            html: function (type, start, end) {
                return `
                    <div class="${SELECTOR.DISPLAY.CONTAINER} display-container">
                        ${this.children(type, start, end)}
                    </div>
                `;
            },
        });

        const validateSelection = (type, selection) => {
            const { start, end } = selection[type];

            return Boolean(start) && Boolean(end);
        };

        function wrap(root, options) {
            return new DatePickerLayout(
                root,
                Utils.merge(DatePickerLayout.DEFAULT_OPTIONS, options)
            );
        }

        function DatePickerLayout(root, options) {
            this.root = root;
            this.options = options;
            this.isValidate = false;

            this.init();
            this.draw();
            this.hydrate();

            this.setValidation();
        }

        DatePickerLayout.prototype.init = function () {
            const { root, options } = this;

            const { type, selection } = options;

            this.type = type;

            this.selection = {
                [TYPE.DATE]: {
                    start: selection[TYPE.DATE].start,
                    end: selection[TYPE.DATE].end,
                },
                [TYPE.MONTH]: {
                    start: selection[TYPE.MONTH].start,
                    end: selection[TYPE.MONTH].end,
                },
                [TYPE.YEAR]: {
                    start: selection[TYPE.YEAR].start,
                    end: selection[TYPE.YEAR].end,
                },
            };

            this.events = {
                preset: eventManagerInstance(root, `.${SELECTOR.PRESET.CONTAINER}`),
                action: eventManagerInstance(root, `.${SELECTOR.ACTION.CONTAINER}`),
                button: eventManagerInstance(root, `.${SELECTOR.BUTTON.CONTAINER}`),
            };
        };

        DatePickerLayout.prototype.destroy = function () {
            const { root, events } = this;

            events.preset.detachEvents();
            events.action.detachEvents();
            events.button.detachEvents();

            events.preset.clearEventListener();
            events.action.clearEventListener();
            events.button.clearEventListener();

            for (; root.firstChild; ) {
                root.removeChild(root.firstChild);
            }
        };

        DatePickerLayout.prototype.draw = function () {
            const { root, type, options, selection } = this;

            const { fluidMode } = options;
            const { start, end } = selection[type];

            const items = [
                { regex: REGEX.CHUNK.PRESET, html: presetRenderer(root).html(type) },
                { regex: REGEX.CHUNK.DISPLAY, html: displayRenderer(root).html(type, start, end) },
                {
                    regex: REGEX.CHUNK.TYPE,
                    html: fluidMode ? typeButtonRenderer(root).html(type) : "<div></div>",
                },
            ];

            const html = items.reduce((acc, cur) => acc.replace(cur.regex, cur.html), LAYOUT_HTML);

            this.root.innerHTML = html;
        };

        DatePickerLayout.prototype.hydrate = function () {
            const { fluidMode } = this.options;

            this.attachPresetEvents();
            this.attachButtonEvents();

            if (fluidMode) {
                this.attachActionEvents();
            }
        };

        DatePickerLayout.prototype.attachPresetEvents = function () {
            const { events, options } = this;

            const { onClickPreset } = options;
            const { preset } = events;

            const self = this;

            preset.registerEventListener({
                selector: `.${SELECTOR.PRESET.PRESET_BUTTON}`,
                event: "click",
                listener: function (e) {
                    const { start, end } = e.target.dataset;

                    const { type } = self;

                    self.setSelection(start, end);
                    self.setValidation();

                    if (onClickPreset) {
                        onClickPreset(start, end, type);
                    }
                },
            });

            preset.attachEvents();
        };

        DatePickerLayout.prototype.attachActionEvents = function () {
            const { events, options } = this;

            const { action } = events;
            const { onChangeType } = options;

            const self = this;

            action.registerEventListener({
                selector: `.${SELECTOR.ACTION.TYPE_BUTTON.SELF}`,
                event: "click",
                listener: function (e) {
                    const targetType = e.target.dataset.type;

                    const { root, type, events, selection } = self;

                    if (type === targetType) {
                        return false;
                    }

                    const { start, end } = selection[targetType];

                    events.preset.detachEvents();
                    events.action.detachEvents();

                    self.type = targetType;

                    presetRenderer(root).update(targetType);
                    typeButtonRenderer(root).update(targetType);
                    displayRenderer(root).update(targetType, start, end);

                    self.setValidation();

                    events.preset.attachEvents();
                    events.action.attachEvents();

                    if (onChangeType) {
                        onChangeType(targetType, start, end);
                    }
                },
            });

            action.attachEvents();
        };

        DatePickerLayout.prototype.attachButtonEvents = function () {
            const { events, options } = this;

            const { button } = events;
            const { onClickReset, onClickConfirm, onClickCancel } = options;

            const self = this;

            button.registerEventListener({
                selector: `.${SELECTOR.BUTTON.CONFIRM_BUTTON.SELF}`,
                event: "click",
                listener: function () {
                    const { type, selection, isValidate } = self;

                    const { start, end } = selection[type];

                    if (isValidate && onClickConfirm) {
                        onClickConfirm(start, end, type);
                    }
                },
            });

            button.registerEventListener({
                selector: `.${SELECTOR.BUTTON.CANCEL_BUTTON}`,
                event: "click",
                listener: function () {
                    const { type } = self;

                    if (onClickCancel) {
                        onClickCancel(type);
                    }
                },
            });

            button.registerEventListener({
                selector: `.${SELECTOR.BUTTON.RESET_BUTTON}`,
                event: "click",
                listener: function () {
                    const { type } = self;

                    self.setSelection(null, null);
                    self.setValidation();

                    if (onClickReset) {
                        onClickReset(type);
                    }
                },
            });

            button.attachEvents();
        };

        DatePickerLayout.prototype.setSelection = function (start, end) {
            this.updateSelection(start, end);
            this.updateDisplayUI();
        };

        DatePickerLayout.prototype.updateSelection = function (start, end) {
            const { type } = this;

            this.selection[type].start = start;
            this.selection[type].end = end;
        };

        DatePickerLayout.prototype.updateDisplayUI = function () {
            const { root, type, selection } = this;

            const { start, end } = selection[type];

            displayRenderer(root).update(type, start, end);
        };

        DatePickerLayout.prototype.setValidation = function () {
            this.updateValidation();
            this.updateButtonUI();
        };

        DatePickerLayout.prototype.updateValidation = function () {
            const { type, selection } = this;

            this.isValidate = validateSelection(type, selection);
        };

        DatePickerLayout.prototype.updateButtonUI = function () {
            const { root, isValidate } = this;

            const classname = isValidate
                ? SELECTOR.BUTTON.CONFIRM_BUTTON.ACTIVE
                : SELECTOR.BUTTON.CONFIRM_BUTTON.INACTIVE;

            const confirmButton = root.querySelector(`.${SELECTOR.BUTTON.CONFIRM_BUTTON.SELF}`);

            confirmButton.classList.remove(SELECTOR.BUTTON.CONFIRM_BUTTON.ACTIVE);
            confirmButton.classList.remove(SELECTOR.BUTTON.CONFIRM_BUTTON.INACTIVE);

            confirmButton.classList.add(classname);
        };

        DatePickerLayout.prototype.getLibraryContainer = function () {
            const { root } = this;

            return root.querySelector(`.${SELECTOR.LIBRARY.CONTAINER}`);
        };

        DatePickerLayout.DEFAULT_OPTIONS = {
            type: TYPE.DATE,
            fluidMode: false,
            selection: {
                [TYPE.DATE]: { start: null, end: null },
                [TYPE.MONTH]: { start: null, end: null },
                [TYPE.YEAR]: { start: null, end: null },
            },
            onChangeType: null,
            onClickPreset: null,
            onClickReset: null,
            onClickConfirm: null,
            onClickCancel: null,
        };

        wrap.type = TYPE;

        return wrap;
    })();

    // * ==========================
    // * datepickerLibrary
    // * ==========================

    const datepickerLibrary = (function () {
        const TYPE = {
            DATE: "multiple",
            MONTH: "month",
            YEAR: "year",
        };

        const getDayInstanceUnit = (type) => {
            return {
                [TYPE.DATE]: dayInstance.unit.DATE,
                [TYPE.MONTH]: dayInstance.unit.MONTH,
                [TYPE.YEAR]: dayInstance.unit.YEAR,
            }[type];
        };

        const getYearMonth = (v) => {
            const day = dayInstance(v);

            const date = day.toDate();

            if (dayInstance.isInvalidDate(date)) {
                return {
                    year: null,
                    month: null,
                };
            }

            return {
                year: date.getFullYear(),
                month: date.getMonth(),
            };
        };

        const getDateOptions = (start, end) => {
            const { year, month } = getYearMonth(start);

            const dateString = [start, end].filter((d) => Boolean(d)).join(":");

            return {
                selected: {
                    year,
                    month,
                    dates: dateString ? [dateString] : [],
                },
            };
        };

        const getMonthOptions = (start) => {
            const { year, month } = getYearMonth(start);

            return {
                selected: {
                    year,
                    month,
                    dates: null,
                },
            };
        };

        const getYearOptions = (start) => {
            const { year } = getYearMonth(start);

            return {
                selected: {
                    year,
                    month: null,
                    dates: null,
                },
            };
        };

        const getTypeOptions = (type) => {
            return {
                [TYPE.DATE]: getDateOptions,
                [TYPE.MONTH]: getMonthOptions,
                [TYPE.YEAR]: getYearOptions,
            }[type];
        };

        const getRangeOptions = (type, range) => {
            const { min, max } = range[type];

            const convert = (date, isMin) => {
                const day = dayInstance(date);

                const key = isMin ? "min" : "max";

                return dayInstance.isInvalidDate(day.toDate())
                    ? DatePickerLibrary.LIBRARY_DEFAULT_OPTIONS.settings.range[key]
                    : day.toString(dayInstance.unit.DATE);
            };

            return {
                min: convert(min, true),
                max: convert(max, false),
            };
        };

        const handleClickDay = (self, dates, onClickDay) => {
            dates.sort((a, b) => new Date(a) - new Date(b));

            const isEndDate = dates.length > 1;
            const isSameDate = self.prevSelectedDate !== null && dates.length === 0;

            const start = (isSameDate ? self.prevSelectedDate : dates[0]) ?? null;
            const end = (isSameDate ? start : isEndDate ? dates[dates.length - 1] : null) ?? null;

            self.updateLibraryUI(TYPE.DATE, start, end);

            self.prevSelectedDate = dates.length === 1 ? dates[0] : null;

            if (onClickDay) {
                onClickDay(start, end);
            }
        };

        const handleClickMonthYear = (self, year, month, onClickMonth, onClickYear) => {
            const type = self.library.type;

            if (type === TYPE.DATE) {
                return false;
            }

            const unit = getDayInstanceUnit(type);

            const date = new Date();

            date.setFullYear(year);
            date.setMonth(month);

            const dayString = dayInstance(date).toString(unit);

            if (type === TYPE.MONTH) {
                onClickMonth(dayString);
            }

            if (type === TYPE.YEAR) {
                onClickYear(dayString);
            }
        };

        const parseOptions = (self, options) => {
            const { type, lang, selection, range, onClickDay, onClickMonth, onClickYear } = options;

            const { start, end } = selection[type];

            const typeOptions = getTypeOptions(type)(start, end);
            const rangeOptions = getRangeOptions(type, range);

            return Utils.merge(DatePickerLibrary.LIBRARY_DEFAULT_OPTIONS, {
                type,
                settings: {
                    lang,
                    selection: typeOptions.selection,
                    selected: typeOptions.selected,
                    range: rangeOptions,
                },
                actions: {
                    clickDay: (e, dates) => {
                        handleClickDay(self, dates, onClickDay);
                    },
                    clickMonth: (e, month) => {
                        const year = self.library.selectedYear;

                        handleClickMonthYear(self, year, month, onClickMonth, onClickYear);
                    },
                    clickYear: (e, year) => {
                        const month = self.library.selectedMonth;

                        handleClickMonthYear(self, year, month, onClickMonth, onClickYear);
                    },
                },
            });
        };

        function wrap(root, options) {
            return new DatePickerLibrary(
                root,
                Utils.merge(DatePickerLibrary.DEFAULT_OPTIONS, options)
            );
        }

        function DatePickerLibrary(root, options) {
            this.root = root;
            this.options = options;
            this.prevSelectedDate = null;

            this.init();
        }

        DatePickerLibrary.prototype.init = function () {
            const { root, options } = this;

            const libraryOptions = parseOptions(this, options);

            this.library = new window.VanillaCalendar(root, libraryOptions);

            this.library.init();
        };

        DatePickerLibrary.prototype.destroy = function () {
            const { library } = this;

            library.destroy();
        };

        DatePickerLibrary.prototype.updateLibraryUI = function (type, start, end) {
            const { range } = this.options;

            const typeOptions = getTypeOptions(type)(start, end);
            const rangeOptions = getRangeOptions(type, range);

            this.library.type = type;
            this.library.currentType = type;

            this.library.settings.selected = {
                ...this.library.selected,
                ...typeOptions.selected,
            };

            this.library.settings.range.min = rangeOptions.min;
            this.library.settings.range.max = rangeOptions.max;

            this.library.reset();
        };

        DatePickerLibrary.DEFAULT_OPTIONS = {
            lang: "en",
            type: TYPE.DATE,
            selection: {
                [TYPE.DATE]: { start: null, end: null },
                [TYPE.MONTH]: { start: null, end: null },
                [TYPE.YEAR]: { start: null, end: null },
            },
            range: {
                [TYPE.DATE]: { min: null, max: null },
                [TYPE.MONTH]: { min: null, max: null },
                [TYPE.YEAR]: { min: null, max: null },
            },
            onClickDay: null,
            onClickMonth: null,
            onClickYear: null,
        };

        DatePickerLibrary.LIBRARY_DEFAULT_OPTIONS = {
            type: TYPE.DATE,
            settings: {
                lang: "en",
                iso8601: true,
                visibility: {
                    theme: "light",
                },
                selection: {
                    day: "multiple-ranged",
                    month: true,
                    year: true,
                    time: false,
                },
                selected: {
                    dates: null,
                    month: null,
                    year: null,
                },
                range: {
                    min: "1970-01-01",
                    max: "2470-12-31",
                },
            },
            actions: {
                clickDay: null,
                clickMonth: null,
                clickYear: null,
            },
        };

        wrap.type = TYPE;

        return wrap;
    })();

    // * ==========================
    // * imwebDatePicker
    // * ==========================

    const imwebDatePicker = (function () {
        const TYPE = {
            DATE: "date",
            MONTH: "month",
            YEAR: "year",
        };

        const getDayInstanceUnit = (type) => {
            return {
                [TYPE.DATE]: dayInstance.unit.DATE,
                [TYPE.MONTH]: dayInstance.unit.MONTH,
                [TYPE.YEAR]: dayInstance.unit.YEAR,
            }[type];
        };

        const getDatePickerLayoutType = (type) => {
            return {
                [TYPE.DATE]: datepickerLayout.type.DATE,
                [TYPE.MONTH]: datepickerLayout.type.MONTH,
                [TYPE.YEAR]: datepickerLayout.type.YEAR,
            }[type];
        };

        const getLibraryType = (type) => {
            return {
                [TYPE.DATE]: datepickerLibrary.type.DATE,
                [TYPE.MONTH]: datepickerLibrary.type.MONTH,
                [TYPE.YEAR]: datepickerLibrary.type.YEAR,
            }[type];
        };

        const getLibraryTypeByDatePickerLayoutType = (type) => {
            return {
                [datepickerLayout.type.DATE]: datepickerLibrary.type.DATE,
                [datepickerLayout.type.MONTH]: datepickerLibrary.type.MONTH,
                [datepickerLayout.type.YEAR]: datepickerLibrary.type.YEAR,
            }[type];
        };

        const toDateString = (unit, value) => {
            const day = dayInstance(value);

            return dayInstance.isInvalidDate(day.toDate()) ? null : day.toString(unit);
        };

        const getSelection = (type, selection) => {
            const unit = getDayInstanceUnit(type);

            const { start, end } = selection[type];

            return {
                start: toDateString(unit, start),
                end: toDateString(unit, end),
            };
        };

        const getRange = (type, range) => {
            const unit = getDayInstanceUnit(type);

            const { min, max } = range[type];

            return {
                min: toDateString(unit, min),
                max: toDateString(unit, max),
            };
        };

        const parseOptions = (self, options) => {
            const { lang, type, fluidMode, selection, range, onConfirm, onCancel } = options;

            const date = getSelection(TYPE.DATE, selection);
            const month = getSelection(TYPE.MONTH, selection);
            const year = getSelection(TYPE.YEAR, selection);

            return {
                layout: {
                    fluidMode,
                    type: getDatePickerLayoutType(type),
                    selection: {
                        [datepickerLayout.type.DATE]: { ...date },
                        [datepickerLayout.type.MONTH]: { ...month },
                        [datepickerLayout.type.YEAR]: { ...year },
                    },
                    onChangeType: (type, start, end) => handleChangeType(self, type, start, end),
                    onClickPreset: (start, end, type) => handleClickPreset(self, type, start, end),
                    onClickReset: (type) => handleClickReset(self, type),
                    onClickConfirm: onConfirm,
                    onClickCancel: onCancel,
                },
                library: {
                    lang,
                    type: getLibraryType(type),
                    selection: {
                        [datepickerLibrary.type.DATE]: { ...date },
                        [datepickerLibrary.type.MONTH]: { ...month },
                        [datepickerLibrary.type.YEAR]: { ...year },
                    },
                    range: {
                        [datepickerLibrary.type.DATE]: { ...getRange(TYPE.DATE, range) },
                        [datepickerLibrary.type.MONTH]: { ...getRange(TYPE.MONTH, range) },
                        [datepickerLibrary.type.YEAR]: { ...getRange(TYPE.YEAR, range) },
                    },
                    onClickDay: (start, end) => handleClickLibraryDay(self, start, end),
                    onClickMonth: (month) => handleClickLibraryMonth(self, month),
                    onClickYear: (year) => handleClickLibraryYear(self, year),
                },
            };
        };

        const handleChangeType = (self, type, start, end) => {
            const libraryType = getLibraryTypeByDatePickerLayoutType(type);

            self.library.instance.updateLibraryUI(libraryType, start, end);
        };

        const handleClickPreset = (self, type, start, end) => {
            const libraryType = getLibraryTypeByDatePickerLayoutType(type);

            self.library.instance.updateLibraryUI(libraryType, start, end);
        };

        const handleClickReset = (self, type) => {
            const libraryType = getLibraryTypeByDatePickerLayoutType(type);

            self.library.instance.updateLibraryUI(libraryType, null, null);
        };

        const handleClickLibraryDay = (self, start, end) => {
            self.layout.instance.setSelection(start, end);
            self.layout.instance.setValidation();
        };

        const handleClickLibraryMonth = (self, month) => {
            self.layout.instance.setSelection(month, month);
            self.layout.instance.setValidation();
        };

        const handleClickLibraryYear = (self, year) => {
            self.layout.instance.setSelection(year, year);
            self.layout.instance.setValidation();
        };

        function wrap(root, options) {
            return new ImwebDatePicker(root, Utils.merge(ImwebDatePicker.DEFAULT_OPTIONS, options));
        }

        function ImwebDatePicker(root, options) {
            this.root = root;
            this.options = options;

            this.init();
        }

        ImwebDatePicker.prototype.init = function () {
            const { root, options } = this;

            const { layout, library } = parseOptions(this, options);

            const layoutInstance = datepickerLayout(root, layout);
            const libraryInstance = datepickerLibrary(
                layoutInstance.getLibraryContainer(),
                library
            );

            this.layout = {
                instance: layoutInstance,
                options: layout,
            };

            this.library = {
                instance: libraryInstance,
                options: library,
            };
        };

        ImwebDatePicker.prototype.destroy = function () {
            const { layout, library } = this;

            library.instance.destroy();
            layout.instance.destroy();
        };

        ImwebDatePicker.DEFAULT_OPTIONS = {
            lang: window.ADMIN_LANG_CODE || "en",
            type: TYPE.DATE,
            fluidMode: false,
            selection: {
                date: { start: null, end: null },
                month: { start: null, end: null },
                year: { start: null, end: null },
            },
            range: {
                date: { min: null, max: null },
                month: { min: null, max: null },
                year: { min: null, max: null },
            },
            onConfirm: null,
            onCancel: null,
        };

        wrap.DEFAULT_OPTIONS = ImwebDatePicker.DEFAULT_OPTIONS;

        return wrap;
    })();

    // * ==========================
    // * Add jQuery module
    // * ==========================

    const INSTANCE_KEY = "imweb-datepicker";

    function Plugin(option) {
        return this.each(function () {
            const $this = $(this);

            const instance = imwebDatePicker(this, typeof option === "object" && option);

            $this.data(INSTANCE_KEY, instance);

            if (typeof option === "string") {
                instance[option]();
            }
        });
    }

    const old = $.fn.imwebdatepicker;

    $.fn.imwebdatepicker = Plugin;
    $.fn.imwebdatepicker.Constructor = imwebDatePicker;

    $.fn.imwebdatepicker.noConflict = function () {
        $.fn.imwebdatepicker = old;

        return this;
    };
})(window.jQuery);
