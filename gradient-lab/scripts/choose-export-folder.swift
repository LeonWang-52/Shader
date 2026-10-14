import AppKit

// A user-triggered folder chooser for the local macOS editor.
let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let panel = NSOpenPanel()
panel.title = "选择作品导出文件夹"
panel.message = "后续导出的图片、视频和参数文件将保存到这里。"
panel.prompt = "选择此文件夹"
panel.canChooseDirectories = true
panel.canChooseFiles = false
panel.canCreateDirectories = true
panel.allowsMultipleSelection = false
if CommandLine.arguments.count > 1 {
    panel.directoryURL = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
}
app.activate(ignoringOtherApps: true)
let response = panel.runModal()
let result: [String: Any] = response == .OK && panel.url != nil
    ? ["path": panel.url!.path, "cancelled": false]
    : ["cancelled": true]
let data = try JSONSerialization.data(withJSONObject: result)
print(String(data: data, encoding: .utf8)!)
