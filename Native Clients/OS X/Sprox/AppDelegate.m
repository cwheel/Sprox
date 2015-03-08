//
//  AppDelegate.m
//  Sprox
//
//  Created by Cameron Wheeler on 3/7/15.
//  Copyright (c) 2015 Cameron Wheeler. All rights reserved.
//

#import "AppDelegate.h"
#define k_SERVER_URL @"http://localhost:3000/login"

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

- (void)loginWithUsername:(NSString *)username andPassword:(NSString *)password {
    //Build the request
    NSData *post = [[NSString stringWithFormat:@"username=%@&password=%@", username, password] dataUsingEncoding:NSASCIIStringEncoding allowLossyConversion:YES];
    NSMutableURLRequest *req = [[NSMutableURLRequest alloc] initWithURL:[NSURL URLWithString:k_SERVER_URL]];
    
    //Setup the request prams
    [req setHTTPMethod:@"POST"];
    [req setHTTPBody:post];
    [req setValue:@"application/x-www-form-urlencoded" forHTTPHeaderField:@"Content-Type"];
    
    //Dispatch a new task
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        //Send out the request
        NSHTTPURLResponse *response = nil;
        NSData *resp = [NSURLConnection sendSynchronousRequest:req returningResponse:&response error:nil];
        id respDict = [NSJSONSerialization JSONObjectWithData:resp options:0 error:nil];
        
        dispatch_async(dispatch_get_main_queue(), ^{
            //Check if we got a dictionary back
            if([respDict isKindOfClass:[NSDictionary class]]) {
                NSDictionary *status = respDict;
                
                //Successful auth
                if ([[status valueForKey:@"loginStatus"] isEqualToString:@"valid"]) {
                    
                } else {
                    //Failed to auth
                    
                }
            } else {
                //Successful auth
                
            }
        });
    });
}

@end
