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

@interface AppDelegate : NSObject <NSApplicationDelegate> {
    IBOutlet NSTextField *user;
    IBOutlet NSTextField *pass;
    IBOutlet NSView *setup;
    IBOutlet NSView *pane1;
    IBOutlet NSView *pane2;
    IBOutlet NSView *pane3;
    IBOutlet NSButton *next;
    IBOutlet NSTextField *paneTitle;
    IBOutlet NSProgressIndicator *setupSyncSpinner;
    
    NSDictionary *funds;
    NSArray *transactions;
    NSString *username;
    NSString *password;
    NSString *sproxServer;
    NSTimer *ucardTimer;
    int pane;
}

//Actions
- (IBAction)next:(id)sender;
- (IBAction)testGet:(id)sender;

//Callbacks
- (void)loginCompleted:(NSDictionary *)status;
- (void)incomingUcardData:(NSDictionary *)ucard;

//Helpers
- (CATransition *)slideAnimation;
- (void)postToURL:(NSURL *)url withParameters:(NSString *)params andCallback:(SEL)callback;

@end