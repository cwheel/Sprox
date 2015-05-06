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

- (IBAction)testGet:(id)sender {
    //Build the request
    NSData *post = [[NSString stringWithFormat:@"username=%@&password=%@", [user stringValue], [pass stringValue]] dataUsingEncoding:NSASCIIStringEncoding allowLossyConversion:YES];
    NSMutableURLRequest *req = [[NSMutableURLRequest alloc] initWithURL:[NSURL URLWithString:@"http://localhost:3000/userInfo/ucard"]];
    
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
            NSLog([[NSString alloc] initWithData:resp encoding:NSUTF8StringEncoding]);
            if([respDict isKindOfClass:[NSDictionary class]]) {
                NSDictionary *status = respDict;
                
                //Successful auth
                if ([[status valueForKey:@"loginStatus"] isEqualToString:@"valid"]) {
                    NSLog([status description]);
                } else {
                    NSLog(@"Auth failed");
                }
            } else {
                NSLog(@"Error parsing responce");
            }
        });
    });
}

- (void)loginWithUsername:(NSString *)username andPassword:(NSString *)password {
    //Build the request
    NSData *post = [[NSString stringWithFormat:@"username=%@&password=%@", username, password] dataUsingEncoding:NSASCIIStringEncoding allowLossyConversion:YES];
    NSMutableURLRequest *req = [[NSMutableURLRequest alloc] initWithURL:[NSURL URLWithString:@"http://localhost:3000/login"]];
    
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
                    [SSKeychain setPassword:password forService:@"Sprox Desktop" account:username];
                } else {
                    NSLog(@"Auth failed");
                    
                }
            } else {
                NSLog(@"Error parsing responce");
            }
        });
    });
}

@end
