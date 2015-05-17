//
//  AppDelegate.h
//  Sprox
//
//  Created by Cameron Wheeler on 3/7/15.
//  Copyright (c) 2015 Cameron Wheeler. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import <QuartzCore/QuartzCore.h>
#import "SSKeychain.h"

@interface AppDelegate : NSObject <NSApplicationDelegate, NSUserNotificationCenterDelegate> {
    IBOutlet NSTextField *user;
    IBOutlet NSTextField *pass;
    IBOutlet NSView *setup;
    IBOutlet NSView *pane1;
    IBOutlet NSView *pane2;
    IBOutlet NSView *pane3;
    IBOutlet NSButton *next;
    IBOutlet NSTextField *paneTitle;
    IBOutlet NSProgressIndicator *setupSyncSpinner;
    IBOutlet NSProgressIndicator *loginSpinner;
    
    IBOutlet NSMenu *statusMenu;
    IBOutlet NSMenu *statusMenuLoading;
    NSStatusItem *statusItem;
    BOOL statusRendered;
    
    IBOutlet NSMenuItem *dd;
    IBOutlet NSMenuItem *swipes;
    IBOutlet NSMenuItem *debit;
    IBOutlet NSMenuItem *sName;
    IBOutlet NSMenuItem *sMajor;
    
    NSDictionary *funds;
    NSDictionary *studentInfo;
    NSArray *transactions;
    
    NSString *username;
    NSString *password;
    NSString *sproxServer;
    NSTimer *ucardTimer;
    int pane;
}

//Actions
- (IBAction)next:(id)sender;
- (IBAction)openSprox:(id)sender;

//Callbacks
- (void)loginCompleted:(NSDictionary *)status;
- (void)authCompleted:(NSDictionary *)status;
- (void)ucardInitialized:(NSDictionary *)ucard;
- (void)ucardUpdate:(NSTimer *)timer;

//Helpers
- (CATransition *)slideAnimation;
- (void)renderMenuItem;
- (void)postToURL:(NSURL *)url withParameters:(NSString *)params andCallback:(SEL)callback;

@end