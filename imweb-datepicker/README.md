# imweb-datepicker.js

일/월/년도 날짜 선택 기능을 제공하는 달력 컴포넌트

## 사용 라이브러리

- [jQuery](https://jquery.com/)
- [vanilla-calendar.js](https://vanilla-calendar.com/)

## 옵션

### lang

달력 locale 옵션 지정

- Type - `string`
- Default - `window.ADMIN_LANG_CODE | en`
- Required - `false`

### type

달력 선택 폼 옵션 (일/월/년도)

- Type - `date | month | year`
- Default - `date`
- Required - `false`

### fluidMode

달력 일/월/년도 선택 가능 여부

- Type - `boolean`
- Default - `false`
- Required - `false`

### selection.date

달력 일 초기 선택 값

- Type - `{ start: Date | string | null, end: Date | string | null }`
- Default - `{ start: null, end: null }`
- Required - `false`

### selection.month

달력 월 초기 선택 값

- Type - `{ start: Date | string | null, end: Date | string | null }`
- Default - `{ start: null, end: null }`
- Required - `false`

### selection.year

달력 년도 초기 선택 값

- Type - `{ start: Date | string | null, end: Date | string | null }`
- Default - `{ start: null, end: null }`
- Required - `false`

### range.date

달력 일 최소/최대 날짜 선택 값

- Type - `{ min: Date | string | null, max: Date | string | null }`
- Default - `{ min: null, max: null }`
- Required - `false`

### range.month

달력 월 최소/최대 날짜 선택 값

- Type - `{ min: Date | string | null, max: Date | string | null }`
- Default - `{ min: null, max: null }`
- Required - `false`

### range.year

달력 년도 최소/최대 날짜 선택 값

- Type - `{ min: Date | string | null, max: Date | string | null }`
- Default - `{ min: null, max: null }`
- Required - `false`

### onConfirm

확인 이벤트

- Type - `(start: string, end: string, type: type) => void`
- Default - `null`
- Required - `false`

### onCancel

취소 이벤트

- Type - `(type: type) => void`
- Default - `null`
- Required - `false`

## 예제

### Default

```javascript
$(element).imwebdatepicker();
```

### Options

```javascript
$(element).imwebdatepicker({
    type: 'date',
    fluidMode: false,
    selection: {
        date: { start: '2023-08-28', end: new Date() }
    },
    range: {
        date: { max: new Date() }
    },
    onConfirm: (start, end, type) => {
        console.log(start, end, type)
    },
    onCancel: (type) => {
        console.log(type)
    }
});
```

# imweb-datepicker-modal.js

imweb-datepicker.js 컴포넌트를 모달 형식으로 띄우는 컴포넌트

## 사용 라이브러리

- [jQuery](https://jquery.com/)
- [Bootstrap](https://getbootstrap.com/docs/4.0/getting-started/introduction/)
- imweb-datepicker.js

## 옵션

**imweb-datepicker.js 컴포넌트 옵션을 그대로 사용**

### container

모달 컨테이너 지정 옵션

- Type - `Element | null`
- Default - `document.body`
- Required - `false`

### show

초기화 시 바로 모달 띄움 여부

- Type - `boolean`
- Default - `true`
- Required - `false`

### onConfirm

확인 이벤트

- Type - `(done: () => void, start: string, end: string, type: type) => void | null`
- Default - `null`
- Required - `false`

> done 실행 시 모달이 닫힘

## 예제

### Default

```javascript
$.imwebdatepickerModal();
```

### Options

```javascript
const instance = $.imwebdatepickerModal({
    container: element,
    show: false,
    onConfirm: (done, start, end, type) => {
        console.log(start, end, type);

        done();
    },
});

instance.show();
```
