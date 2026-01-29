/**
 * Copyright 2017 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Page } from './page';
import type * as api from '../../types/types';
import type * as channels from '@protocol/channels';

export class Keyboard implements api.Keyboard {
  private _page: Page;

  constructor(page: Page) {
    this._page = page;
  }

  async down(key: string) {
    await this._page._channel.keyboardDown({ key });
  }

  async up(key: string) {
    await this._page._channel.keyboardUp({ key });
  }

  async insertText(text: string) {
    await this._page._channel.keyboardInsertText({ text });
  }

  async type(text: string, options: channels.PageKeyboardTypeOptions = {}) {
    await this._page._channel.keyboardType({ text, ...options });
  }

  async press(key: string, options: channels.PageKeyboardPressOptions = {}) {
    await this._page._channel.keyboardPress({ key, ...options });
  }
}

export class Mouse implements api.Mouse {
  private _page: Page;

  constructor(page: Page) {
    this._page = page;
  }

  async move(x: number, y: number, options: { steps?: number } = {}) {
    await this._page._channel.mouseMove({ x, y, ...options });
  }

  async down(options: channels.PageMouseDownOptions = {}) {
    await this._page._channel.mouseDown({ ...options });
  }

  async up(options: channels.PageMouseUpOptions = {}) {
    await this._page._channel.mouseUp(options);
  }

  async click(x: number, y: number, options: channels.PageMouseClickOptions = {}) {
    await this._page._channel.mouseClick({ x, y, ...options });
  }

  async dblclick(x: number, y: number, options: Omit<channels.PageMouseClickOptions, 'clickCount'> = {}) {
    await this._page._wrapApiCall(async () => {
      await this.click(x, y, { ...options, clickCount: 2 });
    }, { title: 'Double click' });
  }

  async wheel(deltaX: number, deltaY: number) {
    await this._page._channel.mouseWheel({ deltaX, deltaY });
  }
}

export class Touchscreen implements api.Touchscreen {
  private _page: Page;

  constructor(page: Page) {
    this._page = page;
  }

  async tap(x: number, y: number) {
    await this._page._channel.touchscreenTap({ x, y });
  }

  /**
   * Dispatches a `touchstart` event.
   *
   * **NOTE** Most of the time, you should use [touchscreen.tapAndDrag(startX, startY, endX, endY[, options])](https://playwright.dev/docs/api/class-touchscreen#touchscreen-tap-and-drag) instead.
   */
  async down(x: number, y: number) {
    await this._page._channel.touchscreenDown({ x, y });
  }

  /**
   * Dispatches a `touchmove` event.
   *
   * **NOTE** Most of the time, you should use [touchscreen.tapAndDrag(startX, startY, endX, endY[, options])](https://playwright.dev/docs/api/class-touchscreen#touchscreen-tap-and-drag) instead.
   */
  async move(x: number, y: number) {
    await this._page._channel.touchscreenMove({ x, y });
  }

  /**
   * Dispatches a `touchend` event.
   *
   * **NOTE** Most of the time, you should use [touchscreen.tapAndDrag(startX, startY, endX, endY[, options])](https://playwright.dev/docs/api/class-touchscreen#touchscreen-tap-and-drag) instead.
   */
  async up(x: number, y: number) {
    await this._page._channel.touchscreenUp({ x, y });
  }

  /**
   * Performs a tap and drag gesture by dispatching `touchstart`, multiple `touchmove`, and `touchend` events.
   *
   * **Usage**
   *
   * ```js
   * await page.touchscreen.tapAndDrag(100, 100, 200, 200);
   * ```
   */
  async tapAndDrag(startX: number, startY: number, endX: number, endY: number, options: { steps?: number } = {}) {
    await this._page._wrapApiCall(async () => {
      const steps = options.steps ?? 10;

      // Start touch
      await this.down(startX, startY);

      // Move in steps to simulate smooth drag
      for (let i = 1; i <= steps; i++) {
        const progress = i / steps;
        const x = startX + (endX - startX) * progress;
        const y = startY + (endY - startY) * progress;
        await this.move(x, y);
      }

      // End touch
      await this.up(endX, endY);
    }, { title: 'Tap and drag' });
  }
}
