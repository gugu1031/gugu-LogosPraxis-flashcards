import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.protectPrivateStudyData()
        }
        return true
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        protectPrivateStudyData()
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    private func protectPrivateStudyData() {
        guard let libraryURL = FileManager.default.urls(
            for: .libraryDirectory,
            in: .userDomainMask
        ).first else {
            return
        }

        for relativePath in ["WebKit", "Caches"] {
            var targetURL = libraryURL.appendingPathComponent(relativePath, isDirectory: true)
            guard FileManager.default.fileExists(atPath: targetURL.path) else {
                continue
            }

            var resourceValues = URLResourceValues()
            resourceValues.isExcludedFromBackup = true
            try? targetURL.setResourceValues(resourceValues)
            try? FileManager.default.setAttributes(
                [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication],
                ofItemAtPath: targetURL.path
            )
        }
    }
}
