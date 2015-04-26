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
    
    int pane;
}

- (IBAction)next:(id)sender;
- (void)loginWithUsername:(NSString *)user andPassword:(NSString *)pass;

@end

