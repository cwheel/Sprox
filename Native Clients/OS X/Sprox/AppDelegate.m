//
//  AppDelegate.m
//  Sprox
//
//  Created by Cameron Wheeler on 3/7/15.
//  Copyright (c) 2015 Cameron Wheeler. All rights reserved.
//

#import "AppDelegate.h"

@interface AppDelegate ()

@property (weak) IBOutlet NSWindow *window;
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
    pane = 0;
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
    // Insert code here to tear down your application
}

- (IBAction)next:(id)sender {
    if (pane == 0) {
        [self loginWithUsername:[user stringValue] andPassword:[pass stringValue]];
    }
}

- (void)socketIO:(SocketIO *)socket didReceiveEvent:(SocketIOPacket *)packet {
    id respDict = [NSJSONSerialization JSONObjectWithData:[packet.data dataUsingEncoding:NSUTF8StringEncoding] options:0 error:nil];
    
    if([respDict isKindOfClass:[NSDictionary class]]) {
        NSDictionary *resp = respDict;
        NSString *event = [resp valueForKey:@"name"];
        
        if ([event isEqualToString:@"authenticateStatusAPI"]) {
            if ([[[resp valueForKey:@"args"][0] valueForKey:@"status"] isEqualToString:@"success"]) {
                NSLog(@"Authentication attempt succeeded");
            } else {
                NSLog(@"Authentication attempt failed; try re-entering your username/password.");
            }
        } else if ([event isEqualToString:@"getFundsAPI"]) {
            funds = [resp valueForKey:@"args"][0];
            NSLog([funds description]);
        } else if ([event isEqualToString:@"getHistoryAPI"]) {
            transactions = [resp valueForKey:@"args"][0];
        }
    } else {
        NSLog(@"Could not parse SocketIO responce.");
    }
}

- (void)loginWithUsername:(NSString *)username andPassword:(NSString *)password {
    socket = [[SocketIO alloc] initWithDelegate:self];
    [socket connectToHost:@"localhost" onPort:3000];
    
    NSMutableDictionary *dict = [NSMutableDictionary dictionary];
    [dict setObject:username forKey:@"username"];
    [dict setObject:password forKey:@"password"];
    
    [socket sendEvent:@"authenticateAPI" withData:dict];
}

@end
