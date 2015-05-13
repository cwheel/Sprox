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
    NSArray *accounts = [SSKeychain accountsForService:@"Sprox Desktop"];
    sproxServer = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"SproxServer"];
    
    //Set to one for debug
    if ([accounts count] > 1) {
        [_window close];
        
        username = [accounts objectAtIndex:0];
        password = [SSKeychain passwordForService:@"Sprox Desktop" account:username];
    } else {
        [setup setWantsLayer:YES];
        [setup setAnimations:[NSDictionary dictionaryWithObject:[self slideAnimation] forKey:@"subviews"]];
        [setup addSubview:pane1];
        
        [_window makeKeyWindow];
        [_window makeFirstResponder:user];
        
        [paneTitle setStringValue:@"Login"];
        
        pane = 1;
    }
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
    // Insert code here to tear down your application
}

#pragma mark Actions

- (IBAction)next:(id)sender {
    if (pane == 1) {
        username = [user stringValue];
        password = [pass stringValue];
        
        [self postToURL:[NSURL URLWithString:[NSString stringWithFormat:@"%@/login", sproxServer]]
              withParameters:[NSString stringWithFormat:@"username=%@&password=%@", username, password]
              andCallback:@selector(loginCompleted:)];
    } else if (pane == 3) {
        [_window close];
    }
}

- (IBAction)testGet:(id)sender {
    [self postToURL:[NSURL URLWithString:[NSString stringWithFormat:@"%@/userInfo/ucard", sproxServer]]
          withParameters:[NSString stringWithFormat:@"username=%@&password=%@", username, password]
          andCallback:@selector(incomingUcardData:)];
}

#pragma mark Callbacks

- (void)loginCompleted:(NSDictionary *)status {
    if ([[status valueForKey:@"loginStatus"] isEqualToString:@"valid"]) {
        [SSKeychain setPassword:password forService:@"Sprox Desktop" account:username];
        
        pane = 2;
        [[setup animator] replaceSubview:pane1 with:pane2];
        
        [setupSyncSpinner startAnimation:nil];
        [next setHidden:YES];
        [paneTitle setStringValue:@"Syncing"];
        
        [self postToURL:[NSURL URLWithString:[NSString stringWithFormat:@"%@/userInfo/ucard", sproxServer]]
         withParameters:[NSString stringWithFormat:@"username=%@&password=%@", username, password]
            andCallback:@selector(incomingUcardData:)];
    } else {
        static int numberOfShakes = 3;
        static float durationOfShake = 0.5f;
        static float vigourOfShake = 0.05f;
        
        CGRect frame = [_window frame];
        CAKeyframeAnimation *shakeAnimation = [CAKeyframeAnimation animation];
        
        CGMutablePathRef shakePath = CGPathCreateMutable();
        CGPathMoveToPoint(shakePath, NULL, NSMinX(frame), NSMinY(frame));
        for (NSInteger index = 0; index < numberOfShakes; index++){
            CGPathAddLineToPoint(shakePath, NULL, NSMinX(frame) - frame.size.width * vigourOfShake, NSMinY(frame));
            CGPathAddLineToPoint(shakePath, NULL, NSMinX(frame) + frame.size.width * vigourOfShake, NSMinY(frame));
        }
        CGPathCloseSubpath(shakePath);
        shakeAnimation.path = shakePath;
        shakeAnimation.duration = durationOfShake;
        
        [_window setAnimations:[NSDictionary dictionaryWithObject: shakeAnimation forKey:@"frameOrigin"]];
        [[_window animator] setFrameOrigin:[_window frame].origin];
        
        [pass setStringValue:@""];
    }
}

- (void)incomingUcardData:(NSDictionary *)ucard {
    NSLog(@"dfgf");
    [next setTitle:@"Finish"];
    [next setHidden:NO];
    [paneTitle setStringValue:@"Setup Complete"];
    [[setup animator] replaceSubview:pane2 with:pane3];
    
    NSLog([ucard description]);
}

#pragma mark Helpers

- (void)postToURL:(NSURL *)url withParameters:(NSString *)params andCallback:(SEL)callback {
    //Build the request
    NSData *post = [params dataUsingEncoding:NSASCIIStringEncoding allowLossyConversion:YES];
    NSMutableURLRequest *req = [[NSMutableURLRequest alloc] initWithURL:url];
    NSLog([url absoluteString]);
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
                NSLog([resp description]);
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

- (CATransition *)slideAnimation {
    CATransition *transition = [CATransition animation];
    [transition setType:kCATransitionMoveIn];
    [transition setSubtype:kCATransitionFromRight];
    return transition;
}

@end
