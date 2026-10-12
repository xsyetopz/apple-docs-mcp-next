export interface TechnologiesPage {
    hierarchy:     Hierarchy;
    identifier:    Identifier;
    kind:          string;
    legalNotices:  LegalNotices;
    metadata:      Metadata;
    schemaVersion: SchemaVersion;
    sections:      Section[];
    references:    References;
}

export interface Hierarchy {
    homepageNavigation: HomepageNavigation[];
}

export interface HomepageNavigation {
    reference: string;
}

export interface Identifier {
    interfaceLanguage: string;
    url:               string;
}

export interface LegalNotices {
    copyright:     string;
    privacyPolicy: string;
    termsOfUse:    string;
}

export interface Metadata {
    availableLanguages:   string[];
    defaultSuggestedTags: string[];
    role:                 string;
    title:                string;
}

export interface References {
    "Accessibility-PageImage-card.png":                                                  AccessibilityPageImageCardPNG;
    "ActivityKit-PageImage-card.png":                                                    AccessibilityPageImageCardPNG;
    "AppTrackingTransparency-PageImage-card.png":                                        AccessibilityPageImageCardPNG;
    "Combine-PageImage-card.png":                                                        AccessibilityPageImageCardPNG;
    "FSKit-PageImage-card.png":                                                          AccessibilityPageImageCardPNG;
    "FinanceKit-PageImage-card.png":                                                     AccessibilityPageImageCardPNG;
    "RealityComposerPro_Default-1024.png":                                               AccessibilityPageImageCardPNG;
    "Safari-Developer-Tools-PageImage-card.png":                                         AccessibilityPageImageCardPNG;
    "Sample-Code-Library-PageImage-card.png":                                            AccessibilityPageImageCardPNG;
    "Swift-PageImage-card.png":                                                          AccessibilityPageImageCardPNG;
    "SwiftUI-PageImage-card.png":                                                        AccessibilityPageImageCardPNG;
    "UserNotifications-PageImage-card.png":                                              AccessibilityPageImageCardPNG;
    "Xcode-PageImage-card.png":                                                          AccessibilityPageImageCardPNG;
    "advanced-commerce-PageImage-card.png":                                              AccessibilityPageImageCardPNG;
    "doc://com.apple.documentation/design/human-interface-guidelines":                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ARKit":                                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AVFAudio":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AVFoundation":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AVKit":                                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AVRouting":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AVSystemRouting":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Accelerate":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Accelerate/simd-library":               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Accessibility":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AccessoryAccess":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AccessoryLiveActivities":               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AccessoryNotifications":                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AccessorySetupKit":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AccessoryTransportExtension":           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AccountDataTransfer":                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AccountOrganizationalDataSharing":      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Accounts":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ActivityKit":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AdAttributionKit":                      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AdServices":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AdSupport":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AddressBook":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AddressBookUI":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AdvancedCommerceAPI":                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AlarmKit":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppClip":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppDataTransfer":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppIntents":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppIntentsTesting":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppKit":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppLicenseDeliverySDK":                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppMigrationKit":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppStoreConnectAPI":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppStoreReceipts":                      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppStoreServerAPI":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppStoreServerNotifications":           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppTrackingTransparency":               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Apple-Ads-Platform-API":                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppleArchive":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppleMapsServerAPI":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppleMusicAPI":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppleMusicFeed":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppleNews":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ApplePayMerchantTokenUsageInformation": DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ApplePayWebMerchantRegistrationAPI":    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ApplePayontheWeb":                      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ApplePencil":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AppleTVFeed":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AssetsLibrary":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Assignables":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AudioAccessoryKit":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AudioDriverKit":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AudioToolbox":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AudioUnit":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AuthenticationServices":                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AutomatedDeviceEnrollment":             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AutomaticAssessmentConfiguration":      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/AutomaticSignInAPI":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Automator":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/BackgroundAssets":                      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/BackgroundTasks":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/BlockStorageDeviceDriverKit":           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/BrowserEngineCore":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/BrowserEngineKit":                      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/BrowserKit":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/BundleResources":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CFNetwork":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CKToolJS":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CallKit":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CarKey":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CarPlay":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Charts":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Cinematic":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ClassKit":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ClassKitCatalogAPI":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ClassKitUI":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ClockKit":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CloudKit":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CloudKitJS":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Collaboration":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ColorSync":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Combine":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CompositorServices":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Compression":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ComputeGraph":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ContactProvider":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Contacts":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ContactsUI":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreAI":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreAudio":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreAudioKit":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreAudioTypes":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreBluetooth":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreData":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreFoundation":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreGraphics":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreHID":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreHaptics":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreImage":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreLocation":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreLocationUI":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreMIDI":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreML":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreMedia":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreMediaIO":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreMotion":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreNFC":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreSpotlight":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreTelephony":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreText":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreTransferable":                      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreVideo":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CoreWLAN":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CrashReportExtension":                  DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CreateML":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CreateMLComponents":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CryptoKit":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/CryptoTokenKit":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/DarwinNotify":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/DataDetection":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/DeclaredAgeRange":                      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/DeveloperToolsSupport":                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/DeviceActivity":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/DeviceCheck":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/DeviceDiscoveryExtension":              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/DeviceDiscoveryUI":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/DeviceManagement":                      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/DiskArbitration":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/DiskImageKit":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Dispatch":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Distributed":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/DockKit":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/DriverKit":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/EndpointSecurity":                      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/EnergyKit":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/EnterpriseProgramAPI":                  DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Evaluations":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/EventKit":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/EventKitUI":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ExceptionHandling":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ExecutionPolicy":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ExposureNotification":                  DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ExtensionFoundation":                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ExtensionKit":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ExternalAccessory":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ExternalPurchaseServerAPI":             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/FSKit":                                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/FamilyControls":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/FileProvider":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/FileProviderUI":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/FinanceKit":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/FinanceKitUI":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/FinderSync":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ForceFeedback":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Foundation":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/FoundationModels":                      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/FoveatedStreaming":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/GLKit":                                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/GSS":                                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/GameController":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/GameKit":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/GameSave":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/GameplayKit":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/GeoToolbox":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/GroupActivities":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/HIDDriverKit":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/HTTP-Live-Streaming":                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/HealthKit":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/HomeKit":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Hypervisor":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/IOBluetooth":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/IOBluetoothUI":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/IOSurface":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/IOUSBHost":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/IdentityDocumentServices":              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/IdentityDocumentServicesUI":            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/IdentityLookup":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ImageCaptureCore":                      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ImageIO":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ImagePlayground":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ImmersiveMediaSupport":                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/InputMethodKit":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/JavaScriptCore":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/JournalingSuggestions":                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/LatentSemanticMapping":                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/LightweightCodeRequirements":           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/LinkPresentation":                      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/LiveCommunicationKit":                  DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/LivePhotosKitJS":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/LocalAuthentication":                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/LocalAuthenticationEmbeddedUI":         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/LockedCameraCapture":                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MIDIDriverKit":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MLCompute":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MailKit":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ManagedApp":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ManagedAppDistribution":                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ManagedSettings":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ManagedSettingsUI":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MapKit":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MapKitJS":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MarketplaceKit":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Matter":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MatterSupport":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MediaAccessibility":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MediaDevice":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MediaExtension":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MediaIntelligence":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MediaIntents":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MediaLibrary":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MediaPlayer":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MediaSetup":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MediaToolbox":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MerchantTokenNotificationServices":     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MessageUI":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Messages":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Metal":                                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MetalFX":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MetalKit":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MetalPerformanceShaders":               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MetalPerformanceShadersGraph":          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MetricKit":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ModelIO":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MultipeerConnectivity":                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MusicKit":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/MusicUnderstanding":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/NaturalLanguage":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/NearbyInteraction":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Network":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/NetworkExtension":                      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/NetworkingDriverKit":                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/NotaryAPI":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/NotificationCenter":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/NowPlaying":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/OSLog":                                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ObjectiveC":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Observation":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/OpenDirectory":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/OpenGLES":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/PCIDriverKit":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/PDFKit":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/PHASE":                                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/PackageDescription":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/PaperKit":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ParavirtualizedGraphics":               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/PassKit":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/PencilKit":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/PermissionKit":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/PhotoKit":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/PreferencePanes":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ProximityReader":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/PushKit":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/PushToTalk":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Quartz":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/QuartzCore":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/QuickLook":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/QuickLookThumbnailing":                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/QuickLookUI":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/RealityComposerPro":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/RealityKit":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/RegexBuilder":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/RelevanceKit":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ReplayKit":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/RetentionMessaging":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/RoomPlan":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/RosterAPI":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SCSIControllerDriverKit":               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SCSIPeripheralsDriverKit":              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SKAdNetworkforWebAds":                  DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SafariServices":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SafariServices/safari-app-extensions":  DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SafetyKit":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SampleCode":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SceneKit":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ScreenCaptureKit":                      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ScreenSaver":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ScreenTime":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ScriptingBridge":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SecureElementCredential":               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Security":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SecurityFoundation":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SecurityInterface":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SensitiveContentAnalysis":              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SensorKit":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SerialDriverKit":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ServiceManagement":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ServicesAccountLinking":                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ShaderGraph":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SharedWithYou":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ShazamKit":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SigninwithApple":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SiriEventSuggestionsMarkup":            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SiriKit":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SiriKitCloudMedia":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Snapshots":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Social":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SoundAnalysis":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Spatial":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SpatialPreview":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Speech":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SpriteKit":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/StateReporting":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/StoreKit":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/StoreKitTest":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SuggestedActions":                      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Swift":                                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SwiftData":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SwiftUI":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Symbols":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Synchronization":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/System":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SystemConfiguration":                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/SystemExtensions":                      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/TVML":                                  DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/TVMLKit":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/TVServices":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/TVUIKit":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/TabletopKit":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/TabularData":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/TechnologyOverviews":                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Technotes":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/TelephonyMessagingKit":                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Testing":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ThreadNetwork":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/TipKit":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/TouchController":                       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Translation":                           DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/TranslationUIProvider":                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/TrustInsights":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/UIKit":                                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/UIKit/mac-catalyst":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/USBDriverKit":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/USBSerialDriverKit":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/USD":                                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/USDKit":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/UniformTypeIdentifiers":                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Updates":                               DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/UserNotifications":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/UserNotificationsUI":                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/VideoDriverKit":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/VideoSubscriberAccount":                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/VideoToolbox":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Virtualization":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Vision":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/VisionKit":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/VisualIntelligence":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/WalletOrders":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/WalletPasses":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/WatchConnectivity":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/WatchKit":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/WeatherKit":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/WeatherKitRESTAPI":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/WebKit":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/WiFiAware":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/WiFiInfrastructure":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/WidgetKit":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/WirelessInsights":                      DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/WorkoutKit":                            DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/XCTest":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/XCUIAutomation":                        DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/XPC":                                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Xcode":                                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Xcode-Release-Notes":                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Xcode/Xcode-Cloud":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/Xcode/swift-packages":                  DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/XcodeKit":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/analytics-reports":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/apple-school-and-business-manager-api": DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/apple-silicon":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/apple_ads":                             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/applicationservices":                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/coreservices":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/dnssd":                                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/hvf":                                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/iAd":                                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/iTunesLibrary":                         DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/iWorkDocumentExportingAPI":             DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/installer_js":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/iokit":                                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/ios-ipados-release-notes":              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/kernel":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/macos-release-notes":                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/os":                                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/playgroundbluetooth":                   DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/playgroundsupport":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/professional_video_applications":       DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/quicktime-file-format":                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/safari-developer-tools":                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/safari-release-notes":                  DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/swift-playgrounds":                     DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/tvmljs":                                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/tvos-release-notes":                    DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/visionOS":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/visionos-release-notes":                DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/vmnet":                                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/watchOS-Apps":                          DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/watchos-release-notes":                 DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/webkitjs":                              DocCOMAppleDocumentationD;
    "doc://com.apple.documentation/documentation/xcselect":                              DocCOMAppleDocumentationD;
    "doc://com.apple.welcome-experience-documentation/documentation":                    DocCOMAppleWelcomeExperienceDocumentationDocumentation;
    "doc://com.apple.welcome-experience-documentation/documentation/technologies":       DocCOMAppleWelcomeExperienceDocumentationDocumentation;
    "featured.svg":                                                                      AccessibilityPageImageCardPNG;
    "foundation-models-framework-landing-PageImage-card.png":                            AccessibilityPageImageCardPNG;
    "headset-orange.svg":                                                                SVG;
    "https://carekit-apple.github.io/CareKit/documentation/carekit":                     DocCOMAppleWelcomeExperienceDocumentationDocumentation;
    "https://developer.apple.com/musickit/web/":                                         DocCOMAppleWelcomeExperienceDocumentationDocumentation;
    "https://github.com/ResearchKit":                                                    DocCOMAppleWelcomeExperienceDocumentationDocumentation;
    "https://security.apple.com/documentation/private-cloud-compute/":                   DocCOMAppleWelcomeExperienceDocumentationDocumentation;
    "https://www.swift.org/documentation/docc":                                          DocCOMAppleWelcomeExperienceDocumentationDocumentation;
    "human-interface-guidelines-page-image-card.png":                                    AccessibilityPageImageCardPNG;
    "image-playground-PageImage-card.png":                                               AccessibilityPageImageCardPNG;
    "immersive-media-support-framework-PageImage-card.png":                              AccessibilityPageImageCardPNG;
    "sample-code-library.svg":                                                           SVG;
    "swiftData-PageImage-card.png":                                                      AccessibilityPageImageCardPNG;
    "technology-overview-PageImage.png":                                                 AccessibilityPageImageCardPNG;
    "visionOS-PageImage-card.png":                                                       AccessibilityPageImageCardPNG;
    "watchOSApps-PageImage-card.png":                                                    AccessibilityPageImageCardPNG;
}

export interface AccessibilityPageImageCardPNG {
    alt:        string;
    identifier: string;
    type:       string;
    variants:   AccessibilityPageImageCardPNGVariant[];
}

export interface AccessibilityPageImageCardPNGVariant {
    traits: string[];
    url:    string;
}

export interface DocCOMAppleDocumentationD {
    abstract:    Abstract[];
    identifier:  string;
    images?:     Image[];
    kind:        string;
    role:        string;
    title:       string;
    type:        string;
    url:         string;
    deprecated?: boolean;
    beta?:       boolean;
}

export interface Abstract {
    text: string;
    type: string;
}

export interface Image {
    identifier: string;
    type:       string;
}

export interface DocCOMAppleWelcomeExperienceDocumentationDocumentation {
    identifier:         string;
    title:              string;
    titleInlineContent: Abstract[];
    type:               string;
    url:                string;
}

export interface SVG {
    alt:        string;
    identifier: string;
    type:       string;
    variants:   HeadsetOrangeSVGVariant[];
}

export interface HeadsetOrangeSVGVariant {
    svgID:  string;
    traits: string[];
    url:    string;
}

export interface SchemaVersion {
    major: number;
    minor: number;
    patch: number;
}

export interface Section {
    groups: Group[];
    kind:   string;
}

export interface Group {
    name:         string;
    technologies: Technology[];
}

export interface Technology {
    content:     Abstract[];
    destination: Destination;
    languages:   string[];
    tags:        string[];
    title:       string;
}

export interface Destination {
    identifier: string;
    isActive:   boolean;
    type:       string;
}
