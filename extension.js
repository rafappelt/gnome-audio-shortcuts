/* Gnome extension to toggle bluetooth connection to a specific device
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const GETTEXT_DOMAIN = 'my-indicator-extension';

const { Gio, GObject, St, GLib } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();

const _ = ExtensionUtils.gettext;

const BLUETOOTH_DEVICE_ADDRESS = "74:A7:EA:22:D2:DB";
const BLUETOOTH_ACTIVE_ICON = 'alexa-on.svg';
const BLUETOOTH_INACTIVE_ICON = 'alexa-off.svg';

const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init() {
      super._init(0.0, _('Toggle Alexa Bluetooth'));

      this.icon = new St.Icon({
        gicon: Gio.icon_new_for_string(Me.path + '/' + BLUETOOTH_INACTIVE_ICON),
        // style_class: 'system-status-icon',
      });

      this.add_child(this.icon);

      this._refreshIcon();

      this.connect('button-press-event', () => {
        this._toggleBluetooth()
      });
    }

    _toggleBluetooth() {
      this._isDeviceConnected((connected) => {
        if (connected) {
          this._disconnectDevice();
        } else {
          this._connectDevice();
        }
      });
    }

    _isDeviceConnected(callback) {
      let [res, out] = GLib.spawn_command_line_sync(`bluetoothctl info ${BLUETOOTH_DEVICE_ADDRESS}`);
      if (res) {
        let output = out.toString();
        callback(output.includes("Connected: yes"));
      } else {
        callback(false);
      }
    }

    _connectDevice() {
      GLib.spawn_command_line_async(`bluetoothctl connect ${BLUETOOTH_DEVICE_ADDRESS}`);
      this._setIconName(BLUETOOTH_ACTIVE_ICON);
    }
    _disconnectDevice() {
      GLib.spawn_command_line_async(`bluetoothctl disconnect ${BLUETOOTH_DEVICE_ADDRESS}`);
      this._setIconName(BLUETOOTH_INACTIVE_ICON);
    }

    async _refreshIcon() {
      this._isDeviceConnected((connected) => {
        if (connected) {
          this._setIconName(BLUETOOTH_ACTIVE_ICON);
        } else {
          this._setIconName(BLUETOOTH_INACTIVE_ICON);
        }
      });
    }

    _setIconName(iconName) {
      console.log(`Setting icon to ${iconName}`);
      this.icon.gicon = Gio.icon_new_for_string(Me.path + '/' + iconName);
    }

  });

class Extension {
  constructor(uuid) {
    this._uuid = uuid;

    ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
  }

  enable() {
    this._indicator = new Indicator();
    Main.panel.addToStatusArea(this._uuid, this._indicator);
  }

  disable() {
    this._indicator.destroy();
    this._indicator = null;
  }
}

function init(meta) {
  return new Extension(meta.uuid);
}
