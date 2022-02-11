// Sshwifty - A Web SSH client
//
// Copyright (C) 2019-2021 NI Rui <ranqus@gmail.com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import assert from "assert";
import * as sender from "./sender.js";

describe("Sender", () => {
  function generateTestData(size) {
    let d = new Uint8Array(size);

    for (let i = 0; i < d.length; i++) {
      d[i] = i % 256;
    }

    return d;
  }

  it("Send", async () => {
    const maxSegSize = 64;
    let result = [];
    let sd = new sender.Sender(
      (rawData) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            for (let i in rawData) {
              result.push(rawData[i]);
            }

            resolve();
          }, 5);
        });
      },
      maxSegSize,
      300,
      3
    );
    let expected = generateTestData(maxSegSize * 16);

    sd.send(expected);

    let sendCompleted = new Promise((resolve) => {
      let timer = setInterval(() => {
        if (result.length < expected.length) {
          return;
        }

        clearInterval(timer);
        timer = null;
        resolve();
      }, 100);
    });

    await sendCompleted;

    assert.deepStrictEqual(new Uint8Array(result), expected);
  });

  it("Send (Multiple calls)", async () => {
    const maxSegSize = 64;
    let result = [];
    let sd = new sender.Sender(
      (rawData) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            for (let i in rawData) {
              result.push(rawData[i]);
            }

            resolve();
          }, 10);
        });
      },
      maxSegSize,
      300,
      100
    );
    let expectedSingle = generateTestData(maxSegSize * 2),
      expectedLen = expectedSingle.length * 16,
      expected = new Uint8Array(expectedLen);

    for (let i = 0; i < expectedLen; i += expectedSingle.length) {
      expected.set(expectedSingle, i);
    }

    for (let i = 0; i < expectedLen; i += expectedSingle.length) {
      setTimeout(() => {
        sd.send(expectedSingle);
      }, 100);
    }

    let sendCompleted = new Promise((resolve) => {
      let timer = setInterval(() => {
        if (result.length < expectedLen) {
          return;
        }

        clearInterval(timer);
        timer = null;
        resolve();
      }, 100);
    });

    await sendCompleted;

    assert.deepStrictEqual(new Uint8Array(result), expected);
  });
});
