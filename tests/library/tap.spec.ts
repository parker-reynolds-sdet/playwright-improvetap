/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { contextTest as it, expect } from '../config/browserTest';
import type { ElementHandle } from 'playwright-core';

it.use({ hasTouch: true });

it('should send all of the correct events @smoke', async ({ page }) => {
  await page.setContent(`
  <div id="a" style="background: lightblue; width: 50px; height: 50px">a</div>
  <div id="b" style="background: pink; width: 50px; height: 50px">b</div>
`);
  await page.tap('#a');
  const eventsHandle = await trackEvents(await page.$('#b'));
  await page.tap('#b');
  // webkit doesn't send pointerenter or pointerleave or mouseout
  expect(await eventsHandle.jsonValue()).toEqual([
    'pointerover',  'pointerenter',
    'pointerdown',  'touchstart',
    'pointerup',    'pointerout',
    'pointerleave', 'touchend',
    'mouseover',    'mouseenter',
    'mousemove',    'mousedown',
    'mouseup',      'click',
  ]);
});

it('trial run should not tap', async ({ page }) => {
  await page.setContent(`
    <div id="a" style="background: lightblue; width: 50px; height: 50px">a</div>
    <div id="b" style="background: pink; width: 50px; height: 50px">b</div>
  `);
  await page.tap('#a');
  const eventsHandle = await trackEvents(await page.$('#b'));
  await page.tap('#b', { trial: true });
  const expected = ['pointerover', 'pointerenter', 'pointerout', 'pointerleave'];
  expect(await eventsHandle.jsonValue()).toEqual(expected);
});

it('should not send mouse events touchstart is canceled', async ({ page }) => {
  await page.setContent(`<div style="width: 50px; height: 50px; background: red">`);
  await page.evaluate(() => {
    // touchstart is not cancelable unless passive is false
    document.addEventListener('touchstart', t => t.preventDefault(), { passive: false });
  });
  const eventsHandle = await trackEvents(await page.$('div'));
  await page.tap('div');
  expect(await eventsHandle.jsonValue()).toEqual([
    'pointerover',  'pointerenter',
    'pointerdown',  'touchstart',
    'pointerup',    'pointerout',
    'pointerleave', 'touchend',
  ]);
});

it('should not send mouse events when touchend is canceled', async ({ page }) => {
  await page.setContent(`<div style="width: 50px; height: 50px; background: red">`);
  await page.evaluate(() => {
    document.addEventListener('touchend', t => t.preventDefault());
  });
  const eventsHandle = await trackEvents(await page.$('div'));
  await page.tap('div');
  expect(await eventsHandle.jsonValue()).toEqual([
    'pointerover',  'pointerenter',
    'pointerdown',  'touchstart',
    'pointerup',    'pointerout',
    'pointerleave', 'touchend',
  ]);
});

it('should not wait for a navigation caused by a tap', async ({ page, server }) => {
  await page.goto(server.EMPTY_PAGE);
  await page.setContent(`<a href="/intercept-this.html">link</a>;`);
  await Promise.all([
    new Promise(resolve => server.setRoute('/intercept-this.html', resolve)),
    page.tap('a'),
  ]);
});

it('should work with modifiers', async ({ page  }) => {
  await page.setContent('hello world');
  const altKeyPromise = page.evaluate(() => new Promise(resolve => {
    document.addEventListener('touchstart', event => {
      resolve(event.altKey);
    }, { passive: false });
  }));
  // make sure the evals hit the page
  await page.evaluate(() => void 0);
  await page.tap('body', {
    modifiers: ['Alt']
  });
  expect(await altKeyPromise).toBe(true);
});

it('should send well formed touch points', async ({ page }) => {
  const promises = Promise.all([
    page.evaluate(() => new Promise(resolve => {
      document.addEventListener('touchstart', event => {
        resolve([...event.touches].map(t => ({
          identifier: t.identifier,
          clientX: t.clientX,
          clientY: t.clientY,
          pageX: t.pageX,
          pageY: t.pageY,
          radiusX: 'radiusX' in t ? t.radiusX : t['webkitRadiusX'],
          radiusY: 'radiusY' in t ? t.radiusY : t['webkitRadiusY'],
          rotationAngle: 'rotationAngle' in t ? t.rotationAngle : t['webkitRotationAngle'],
          force: 'force' in t ? t.force : t['webkitForce'],
        })));
      }, false);
    })),
    page.evaluate(() => new Promise(resolve => {
      document.addEventListener('touchend', event => {
        resolve([...event.touches].map(t => ({
          identifier: t.identifier,
          clientX: t.clientX,
          clientY: t.clientY,
          pageX: t.pageX,
          pageY: t.pageY,
          radiusX: 'radiusX' in t ? t.radiusX : t['webkitRadiusX'],
          radiusY: 'radiusY' in t ? t.radiusY : t['webkitRadiusY'],
          rotationAngle: 'rotationAngle' in t ? t.rotationAngle : t['webkitRotationAngle'],
          force: 'force' in t ? t.force : t['webkitForce'],
        })));
      }, false);
    })),
  ]);
  // make sure the evals hit the page
  await page.evaluate(() => void 0);
  await page.touchscreen.tap(40, 60);
  const [touchstart, touchend] = await promises;

  expect(touchstart).toEqual([{
    clientX: 40,
    clientY: 60,
    force: 1,
    identifier: 0,
    pageX: 40,
    pageY: 60,
    radiusX: 1,
    radiusY: 1,
    rotationAngle: 0,
  }]);
  expect(touchend).toEqual([]);
});

it('should wait until an element is visible to tap it', async ({ page }) => {
  const div = await page.evaluateHandle(() => {
    const button = document.createElement('button');
    button.textContent = 'not clicked';
    document.body.appendChild(button);
    button.style.display = 'none';
    return button;
  });
  const tapPromise = div.tap();
  await div.evaluate(div => div.onclick = () => div.textContent = 'clicked');
  await div.evaluate(div => div.style.display = 'block');
  await tapPromise;
  expect(await div.textContent()).toBe('clicked');
});

async function trackEvents(target: ElementHandle) {
  const eventsHandle = await target.evaluateHandle(target => {
    const events: string[] = [];
    for (const event of [
      'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'click',
      'pointercancel', 'pointerdown', 'pointerenter', 'pointerleave', 'pointermove', 'pointerout', 'pointerover', 'pointerup',
      'touchstart', 'touchend', 'touchmove', 'touchcancel',
    ])
      target.addEventListener(event, () => events.push(event), false);
    return events;
  });
  return eventsHandle;
}

it.describe('locators', () => {
  it('should send all of the correct events', async ({ page }) => {
    await page.setContent(`
      <div id="a" style="background: lightblue; width: 50px; height: 50px">a</div>
      <div id="b" style="background: pink; width: 50px; height: 50px">b</div>
    `);
    await page.locator('#a').tap();
    await page.locator('#b').tap();
  });
});

it.describe('touchscreen drag', () => {
  it('should send touchstart, touchmove and touchend events', async ({ page }) => {
    await page.setContent(`<div style="width: 500px; height: 500px; background: red"></div>`);
    const eventsHandle = await trackEvents(await page.$('div'));
    await page.touchscreen.down(100, 100);
    await page.touchscreen.move(200, 200);
    await page.touchscreen.move(300, 300);
    await page.touchscreen.up(300, 300);
    const events = await eventsHandle.jsonValue();
    expect(events).toContain('touchstart');
    expect(events).toContain('touchmove');
    expect(events).toContain('touchend');
    expect(events.indexOf('touchstart')).toBeLessThan(events.indexOf('touchmove'));
    expect(events.indexOf('touchmove')).toBeLessThan(events.indexOf('touchend'));
  });

  it('should send multiple touchmove events', async ({ page }) => {
    await page.setContent(`<div style="width: 500px; height: 500px; background: red"></div>`);
    const eventsHandle = await trackEvents(await page.$('div'));
    await page.touchscreen.down(100, 100);
    await page.touchscreen.move(150, 150);
    await page.touchscreen.move(200, 200);
    await page.touchscreen.move(250, 250);
    await page.touchscreen.up(250, 250);
    const events = await eventsHandle.jsonValue();
    const moveEvents = events.filter(e => e === 'touchmove');
    expect(moveEvents.length).toBeGreaterThanOrEqual(3);
  });

  it('should send well formed touch points during drag', async ({ page }) => {
    const touchPoints: Array<{ x: number, y: number, type: string }> = [];
    await page.exposeFunction('pushTouchPoint', (type: string, x: number, y: number) => {
      touchPoints.push({ type, x, y });
    });
    await page.setContent(`<div style="width: 500px; height: 500px; background: red"></div>`);
    await page.evaluate(() => {
      document.addEventListener('touchstart', event => {
        const touch = event.touches[0];
        (window as any).pushTouchPoint('touchstart', touch.clientX, touch.clientY);
      });
      document.addEventListener('touchmove', event => {
        const touch = event.touches[0];
        (window as any).pushTouchPoint('touchmove', touch.clientX, touch.clientY);
      });
      document.addEventListener('touchend', event => {
        (window as any).pushTouchPoint('touchend', 0, 0);
      });
    });
    await page.touchscreen.down(50, 100);
    await page.touchscreen.move(100, 150);
    await page.touchscreen.move(150, 200);
    await page.touchscreen.up(150, 200);

    // Wait a bit for async events to be recorded
    await page.waitForTimeout(100);

    // Verify we got touchstart with correct coordinates
    expect(touchPoints[0]).toEqual({ type: 'touchstart', x: 50, y: 100 });

    // Verify we got at least one touchmove event (browsers may coalesce multiple moves)
    const moveEvents = touchPoints.filter(e => e.type === 'touchmove');
    expect(moveEvents.length).toBeGreaterThanOrEqual(1);
    expect(moveEvents.length).toBeLessThanOrEqual(2);

    // Verify the last move event reached the final position or close to it
    const lastMove = moveEvents[moveEvents.length - 1];
    expect(lastMove.x).toBeGreaterThanOrEqual(100);
    expect(lastMove.y).toBeGreaterThanOrEqual(150);

    // Verify touchend was fired
    const endEvents = touchPoints.filter(e => e.type === 'touchend');
    expect(endEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('should work with modifiers during drag', async ({ page }) => {
    await page.setContent('hello world');
    const modifiersPromise = page.evaluate(() => new Promise(resolve => {
      const modifiers: boolean[] = [];
      document.addEventListener('touchstart', event => {
        modifiers.push(event.altKey);
      }, { passive: false });
      document.addEventListener('touchmove', event => {
        modifiers.push(event.altKey);
      }, { passive: false });
      document.addEventListener('touchend', event => {
        modifiers.push(event.altKey);
        resolve(modifiers);
      }, { passive: false });
    }));
    // make sure the evals hit the page
    await page.evaluate(() => void 0);
    await page.keyboard.down('Alt');
    await page.touchscreen.down(50, 50);
    await page.touchscreen.move(100, 100);
    await page.touchscreen.up(100, 100);
    await page.keyboard.up('Alt');
    const modifiers = await modifiersPromise;
    expect(modifiers).toEqual([true, true, true]);
  });

  it('tapAndDrag should perform complete drag gesture', async ({ page }) => {
    await page.setContent(`<div style="width: 500px; height: 500px; background: red"></div>`);
    const eventsHandle = await trackEvents(await page.$('div'));
    await page.touchscreen.tapAndDrag(100, 100, 300, 300, { steps: 5 });
    const events = await eventsHandle.jsonValue();

    expect(events).toContain('touchstart');
    expect(events).toContain('touchmove');
    expect(events).toContain('touchend');
    const moveEvents = events.filter(e => e === 'touchmove');
    expect(moveEvents.length).toBeGreaterThanOrEqual(5);
  });

  it('tapAndDrag should move through intermediate positions', async ({ page }) => {
    const touchPoints: Array<{ x: number, y: number }> = [];
    await page.exposeFunction('recordPosition', (x: number, y: number) => {
      touchPoints.push({ x, y });
    });
    await page.setContent(`<div style="width: 500px; height: 500px; background: red"></div>`);
    await page.evaluate(() => {
      document.addEventListener('touchstart', event => {
        const touch = event.touches[0];
        (window as any).recordPosition(touch.clientX, touch.clientY);
      });
      document.addEventListener('touchmove', event => {
        const touch = event.touches[0];
        (window as any).recordPosition(touch.clientX, touch.clientY);
      });
    });
    await page.touchscreen.tapAndDrag(100, 100, 200, 200, { steps: 10 });

    // Should start at 100, 100
    expect(touchPoints[0].x).toBe(100);
    expect(touchPoints[0].y).toBe(100);

    // Should have intermediate positions
    expect(touchPoints.length).toBeGreaterThan(5);

    // Positions should be progressive (moving from start to end)
    for (let i = 1; i < touchPoints.length; i++) {
      expect(touchPoints[i].x).toBeGreaterThanOrEqual(touchPoints[i - 1].x);
      expect(touchPoints[i].y).toBeGreaterThanOrEqual(touchPoints[i - 1].y);
    }

    // Should end close to 200, 200 (browsers may skip the final touchmove if it's at the same position as touchup)
    const lastPoint = touchPoints[touchPoints.length - 1];
    expect(lastPoint.x).toBeGreaterThanOrEqual(190);
    expect(lastPoint.x).toBeLessThanOrEqual(200);
    expect(lastPoint.y).toBeGreaterThanOrEqual(190);
    expect(lastPoint.y).toBeLessThanOrEqual(200);
  });

  it('tapAndDrag should respect steps parameter', async ({ page }) => {
    const touchPoints: Array<{ x: number, y: number }> = [];
    await page.exposeFunction('recordPosition', (x: number, y: number) => {
      touchPoints.push({ x, y });
    });
    await page.setContent(`<div style="width: 500px; height: 500px; background: red"></div>`);
    await page.evaluate(() => {
      document.addEventListener('touchmove', event => {
        const touch = event.touches[0];
        (window as any).recordPosition(touch.clientX, touch.clientY);
      });
    });
    await page.touchscreen.tapAndDrag(100, 100, 200, 200, { steps: 3 });

    // With 3 steps, we should get at least 2 touchmove events (browsers may skip the final move if it's at the same position as touchup)
    expect(touchPoints.length).toBeGreaterThanOrEqual(2);
    expect(touchPoints.length).toBeLessThanOrEqual(3);
  });

  it('should not send mouse events when touchstart is canceled during drag', async ({ page }) => {
    await page.setContent(`<div style="width: 500px; height: 500px; background: red">`);
    await page.evaluate(() => {
      document.addEventListener('touchstart', t => t.preventDefault(), { passive: false });
    });
    const eventsHandle = await trackEvents(await page.$('div'));
    await page.touchscreen.down(100, 100);
    await page.touchscreen.move(200, 200);
    await page.touchscreen.up(200, 200);
    const events = await eventsHandle.jsonValue();

    expect(events).toContain('touchstart');
    expect(events).toContain('touchmove');
    expect(events).toContain('touchend');
    // Should not contain mouse events when touchstart is prevented
    expect(events).not.toContain('mousedown');
    expect(events).not.toContain('mousemove');
    expect(events).not.toContain('mouseup');
  });

  it('should throw error when hasTouch is not enabled', async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: false });
    const page = await context.newPage();
    await page.setContent(`<div style="width: 500px; height: 500px; background: red"></div>`);

    let error1: Error | undefined;
    try {
      await page.touchscreen.down(100, 100);
    } catch (e) {
      error1 = e;
    }
    expect(error1?.message).toContain('hasTouch must be enabled');

    let error2: Error | undefined;
    try {
      await page.touchscreen.move(200, 200);
    } catch (e) {
      error2 = e;
    }
    expect(error2?.message).toContain('hasTouch must be enabled');

    let error3: Error | undefined;
    try {
      await page.touchscreen.up(200, 200);
    } catch (e) {
      error3 = e;
    }
    expect(error3?.message).toContain('hasTouch must be enabled');

    let error4: Error | undefined;
    try {
      await page.touchscreen.tapAndDrag(100, 100, 200, 200);
    } catch (e) {
      error4 = e;
    }
    expect(error4?.message).toContain('hasTouch must be enabled');

    await context.close();
  });

  it('should work with viewport coordinates', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.setContent(`<div style="width: 100%; height: 100%; background: red"></div>`);

    const coordinates: Array<{ x: number, y: number }> = [];
    await page.exposeFunction('recordCoordinate', (x: number, y: number) => {
      coordinates.push({ x, y });
    });
    await page.evaluate(() => {
      document.addEventListener('touchstart', event => {
        const touch = event.touches[0];
        (window as any).recordCoordinate(touch.clientX, touch.clientY);
      });
    });

    // Test drag near viewport boundaries
    await page.touchscreen.down(10, 10);
    await page.touchscreen.move(790, 590);
    await page.touchscreen.up(790, 590);

    expect(coordinates[0]).toEqual({ x: 10, y: 10 });
  });
});
