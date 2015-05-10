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
    [setup setWantsLayer:YES];
    [setup addSubview:pane1];
    
    [_window makeKeyWindow];
    [_window makeFirstResponder:user];
    
    pane = 1;
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
    // Insert code here to tear down your application
}

#pragma mark Actions

- (IBAction)next:(id)sender {
    if (pane == 1) {
        [self postToURL:[NSURL URLWithString:@"http://localhost:3000/login"]
              withParameters:[NSString stringWithFormat:@"username=%@&password=%@", [user stringValue], [pass stringValue]]
              andCallback:@selector(loginCompleted:)];
    } else if (pane == 2) {
        [_window close];
    }
}

- (IBAction)testGet:(id)sender {
    [self postToURL:[NSURL URLWithString:@"http://localhost:3000/userInfo/ucard"]
          withParameters:[NSString stringWithFormat:@"username=%@&password=%@", [user stringValue], [pass stringValue]]
          andCallback:@selector(incomingUcardData:)];
}

#pragma mark Callbacks

- (void)loginCompleted:(NSDictionary *)status {
    if ([[status valueForKey:@"loginStatus"] isEqualToString:@"valid"]) {
        [SSKeychain setPassword:[pass stringValue] forService:@"Sprox Desktop" account:[user stringValue]];
        
        pane = 2;
        [[setup animator] replaceSubview:pane1 with:pane2];
        [next setTitle:@"Finish"];
    } else {
        NSLog(@"Auth failed");
    }
}

- (void)incomingUcardData:(NSDictionary *)ucard {
    NSLog([ucard description]);
}

#pragma mark Helpers

- (void)postToURL:(NSURL *)url withParameters:(NSString *)params andCallback:(SEL)callback {
    //Build the request
    NSData *post = [params dataUsingEncoding:NSASCIIStringEncoding allowLossyConversion:YES];
    NSMutableURLRequest *req = [[NSMutableURLRequest alloc] initWithURL:url];
    
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
                NSDictionary *resp = respDict;
                
                //Perform the callback
                IMP imp = [self methodForSelector:callback];
                void (*_callback)(id, SEL, NSDictionary *) = (void *)imp;
                _callback(self, callback, resp);
            } else {
                //Could not understand the servers responce, throw an error
                [NSError errorWithDomain:@"Error parsing responce from server" code:NSURLErrorDownloadDecodingFailedToComplete userInfo:nil];
            }
        });
    });
}

@end
