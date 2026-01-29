# class: Touchscreen
* since: v1.8

The Touchscreen class operates in main-frame CSS pixels relative to the top-left corner of the viewport. Methods on the
touchscreen can only be used in browser contexts that have been initialized with `hasTouch` set to true.

This class is limited to emulating tap gestures. For examples of other gestures simulated by manually dispatching touch events, see the [emulating legacy touch events](../touch-events.md) page.

## async method: Touchscreen.tap
* since: v1.8

Dispatches a `touchstart` and `touchend` event with a single touch at the position ([`param: x`],[`param: y`]).

:::note
[`method: Page.tap`] the method will throw if [`option: Browser.newContext.hasTouch`] option of the browser context is false.
:::

### param: Touchscreen.tap.x
* since: v1.8
- `x` <[float]>

X coordinate relative to the main frame's viewport in CSS pixels.

### param: Touchscreen.tap.y
* since: v1.8
- `y` <[float]>

Y coordinate relative to the main frame's viewport in CSS pixels.

## async method: Touchscreen.down
* since: v1.49

Dispatches a `touchstart` event.

:::note
Most of the time, you should use [`method: Touchscreen.tapAndDrag`] instead.
:::

### param: Touchscreen.down.x
* since: v1.49
- `x` <[float]>

X coordinate relative to the main frame's viewport in CSS pixels.

### param: Touchscreen.down.y
* since: v1.49
- `y` <[float]>

Y coordinate relative to the main frame's viewport in CSS pixels.

## async method: Touchscreen.move
* since: v1.49

Dispatches a `touchmove` event.

:::note
Most of the time, you should use [`method: Touchscreen.tapAndDrag`] instead.
:::

### param: Touchscreen.move.x
* since: v1.49
- `x` <[float]>

X coordinate relative to the main frame's viewport in CSS pixels.

### param: Touchscreen.move.y
* since: v1.49
- `y` <[float]>

Y coordinate relative to the main frame's viewport in CSS pixels.

## async method: Touchscreen.up
* since: v1.49

Dispatches a `touchend` event.

:::note
Most of the time, you should use [`method: Touchscreen.tapAndDrag`] instead.
:::

### param: Touchscreen.up.x
* since: v1.49
- `x` <[float]>

X coordinate relative to the main frame's viewport in CSS pixels.

### param: Touchscreen.up.y
* since: v1.49
- `y` <[float]>

Y coordinate relative to the main frame's viewport in CSS pixels.

## async method: Touchscreen.tapAndDrag
* since: v1.49

Performs a tap and drag gesture by dispatching `touchstart`, multiple `touchmove`, and `touchend` events.

**Usage**

```js
await page.touchscreen.tapAndDrag(100, 100, 200, 200);
```

### param: Touchscreen.tapAndDrag.startX
* since: v1.49
- `startX` <[float]>

Starting X coordinate relative to the main frame's viewport in CSS pixels.

### param: Touchscreen.tapAndDrag.startY
* since: v1.49
- `startY` <[float]>

Starting Y coordinate relative to the main frame's viewport in CSS pixels.

### param: Touchscreen.tapAndDrag.endX
* since: v1.49
- `endX` <[float]>

Ending X coordinate relative to the main frame's viewport in CSS pixels.

### param: Touchscreen.tapAndDrag.endY
* since: v1.49
- `endY` <[float]>

Ending Y coordinate relative to the main frame's viewport in CSS pixels.

### option: Touchscreen.tapAndDrag.steps
* since: v1.49
- `steps` <[int]>

Number of intermediate `touchmove` events to dispatch between the start and end positions. Defaults to `10`. Increasing this value will produce smoother drag animations but may slow down the test.
