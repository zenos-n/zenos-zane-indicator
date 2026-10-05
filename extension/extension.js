import Clutter from "gi://Clutter";
import St from "gi://St";
import Pango from 'gi://Pango';
import Gio from "gi://Gio";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

// The D-Bus interface Python will use to control the extension
const InterfaceXML = `
<node>
  <interface name="org.negzero.ZaneFrontend">
    <method name="UpdatePosition">
      <arg type="i" name="x" direction="in"/>
      <arg type="i" name="y" direction="in"/>
    </method>
    <method name="SetText">
      <arg type="s" name="text" direction="in"/>
    </method>
    <method name="ClearText" />
  </interface>
</node>`;

export default class ZaneExtension {
  enable() {
    // 1. Spans all workspaces, always on top
    this.container = new Clutter.Actor({
      width: global.screen_width,
      height: global.screen_height,
      reactive: false, // 2. Drops all input, passes to windows below
    });
    Main.uiGroup.add_child(this.container);

    // 3. AI Cursor Implementation
    this.cursorActor = new St.Widget({
      width: 24,
      height: 24,
      style_class: "zane-cursor",
      reactive: false,
    });

    this.bubbleActor = new St.Label({
      text: "",
      style_class: "zane-speech-bubble",
      reactive: false,
      visible: false,
    });

    this.bubbleActor.clutter_text.line_wrap = true;
    this.bubbleActor.clutter_text.line_wrap_mode = Pango.WrapMode.WORD;

    this.container.add_child(this.cursorActor);
    this.container.add_child(this.bubbleActor);

    // Setup D-Bus Server for Python to talk to
    this._dbusImpl = Gio.DBusExportedObject.wrapJSObject(InterfaceXML, this);
    this._dbusImpl.export(Gio.DBus.session, "/org/negzero/ZaneFrontend");

    this._nameId = Gio.bus_own_name_on_connection(
      Gio.DBus.session,
      "org.negzero.ZaneFrontend",
      Gio.BusNameOwnerFlags.NONE,
      null,
      null,
    );
  }

  disable() {
    // Clean destruction prevents shell crashes on reload
    if (this._nameId) {
      Gio.bus_unown_name(this._nameId);
      this._nameId = null;
    }
    if (this._dbusImpl) {
      this._dbusImpl.unexport();
      this._dbusImpl = null;
    }
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }

  // --- D-Bus Methods callable from Python ---

  UpdatePosition(x, y) {
    this.cursorActor.set_position(x, y);

    // Dynamic bubble positioning to keep it on screen
    let bx = x > global.screen_width - 600 ? x - 620 : x + 20;
    let by = y < 80 ? y + 30 : y - 60;
    this.bubbleActor.set_position(bx, by);
  }

  SetText(text) {
    this.bubbleActor.set_text(text);
    this.bubbleActor.visible = text.length > 0;
  }

  ClearText() {
    this.bubbleActor.visible = false;
    this.bubbleActor.set_text("");
  }
}
