//
//  AppDelegate.h
//  Sprox
//
//  Created by Cameron Wheeler on 3/7/15.
//  Copyright (c) 2015 Cameron Wheeler. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import "SSKeychain.h"

@interface AppDelegate : NSObject <NSApplicationDelegate> {
    IBOutlet NSTextField *user;
    IBOutlet NSTextField *pass;
    IBOutlet NSView *setup;
    IBOutlet NSView *pane1;
    IBOutlet NSView *pane2;
    IBOutlet NSButton *next;
    
    NSDictionary *funds;
    NSDictionary *transactions;
    int pane;
}

//Actions
- (IBAction)next:(id)sender;
- (IBAction)testGet:(id)sender;

//Callbacks
- (void)loginCompleted:(NSDictionary *)status;
- (void)incomingUcardData:(NSDictionary *)ucard;

//Helpers
- (void)postToURL:(NSURL *)url  withParameters:(NSString *)params andCallback:(SEL)callback;

@end

