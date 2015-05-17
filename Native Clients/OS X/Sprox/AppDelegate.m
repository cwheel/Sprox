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
    pane = -1;
    
    //Set to one for debug
    if ([accounts count] > 1) {
        [_window orderOut:nil];
        
        username = [[accounts objectAtIndex:0] objectForKey:@"acct"];
        password = [SSKeychain passwordForService:@"Sprox Desktop" account:username];
        
        [self postToURL:[NSURL URLWithString:[NSString stringWithFormat:@"%@/login", sproxServer]]
         withParameters:[NSString stringWithFormat:@"username=%@&password=%@", username, password]
            andCallback:@selector(authCompleted:)];
        
    } else {
        [setup setWantsLayer:YES];
        [setup setAnimations:[NSDictionary dictionaryWithObject:[self slideAnimation] forKey:@"subviews"]];
        [setup addSubview:pane1];
        
        [_window makeKeyWindow];
        [_window makeFirstResponder:user];
        
        [paneTitle setStringValue:@"Login"];
        
        pane = 1;
    }
    
    [[NSUserNotificationCenter defaultUserNotificationCenter] setDelegate:self];
}

- (BOOL)userNotificationCenter:(NSUserNotificationCenter *)center shouldPresentNotification:(NSUserNotification *)notification{
    return YES;
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
        
        [loginSpinner startAnimation:sender];
    } else if (pane == 3) {
        [_window orderOut:sender];
    }
}

- (IBAction)openSprox:(id)sender {
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:sproxServer]];
}

#pragma mark Callbacks

- (void)loginCompleted:(NSDictionary *)status {
    [loginSpinner stopAnimation:nil];
    
    if ([[status valueForKey:@"loginStatus"] isEqualToString:@"valid"]) {
        [SSKeychain setPassword:password forService:@"Sprox Desktop" account:username];
        
        pane = 2;
        [[setup animator] replaceSubview:pane1 with:pane2];
        
        [setupSyncSpinner startAnimation:nil];
        [next setHidden:YES];
        [paneTitle setStringValue:@"Syncing"];
        
       [self postToURL:[NSURL URLWithString:[NSString stringWithFormat:@"%@/userInfo/ucard", sproxServer]]
            withParameters:[NSString stringWithFormat:@"username=%@&password=%@", username, password]
            andCallback:@selector(ucardInitialized:)];
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

- (void)authCompleted:(NSDictionary *)status {
    if ([[status valueForKey:@"loginStatus"] isEqualToString:@"valid"]) {
        ucardTimer = [NSTimer scheduledTimerWithTimeInterval:60 target:self selector:@selector(ucardUpdate:) userInfo:nil repeats:YES];
    } else {
        [ucardTimer invalidate];
        
        [setup setWantsLayer:YES];
        [setup setAnimations:[NSDictionary dictionaryWithObject:[self slideAnimation] forKey:@"subviews"]];
        [setup addSubview:pane1];
        
        [_window makeKeyWindow];
        [_window makeFirstResponder:user];
        
        [paneTitle setStringValue:@"Login"];
        
        pane = 1;
    }
}

- (void)ucardInitialized:(NSDictionary *)ucard {
    if ([[ucard objectForKey:@"status"] isEqualToString:@"success"]) {
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
            NSData *fundsRaw = [NSData dataWithContentsOfURL:[NSURL URLWithString:[NSString stringWithFormat:@"%@/userInfo/ucardFunds", sproxServer]]];
            NSData *transactionsRaw = [NSData dataWithContentsOfURL:[NSURL URLWithString:[NSString stringWithFormat:@"%@/userInfo/ucardTransactions", sproxServer]]];
            
            if (!studentInfo) {
                NSData *infoRaw = [NSData dataWithContentsOfURL:[NSURL URLWithString:[NSString stringWithFormat:@"%@/userInfo/spireBasic", sproxServer]]];
                studentInfo = [NSJSONSerialization JSONObjectWithData:infoRaw options:0 error:nil];
            }
            
            /*
             NSUserNotification *notification = [[NSUserNotification alloc] init];
             notification.title = @"Hello, World!";
             notification.informativeText = @"A notification";
             notification.soundName = NSUserNotificationDefaultSoundName;
             
             [[NSUserNotificationCenter defaultUserNotificationCenter] deliverNotification:notification];
             */
            
            funds = [NSJSONSerialization JSONObjectWithData:fundsRaw options:0 error:nil];
            transactions = [NSJSONSerialization JSONObjectWithData:transactionsRaw options:0 error:nil];
            
            dispatch_async(dispatch_get_main_queue(), ^{
                [self renderMenuItem];
                
                if ([funds valueForKey:@"dd"] == [NSNull null]) {
                    [dd setHidden:YES];
                } else {
                    [dd setTitle:[NSString stringWithFormat:@"Dining Dollars: %@", [funds valueForKey:@"dd"]]];
                }
                
                [debit setTitle:[NSString stringWithFormat:@"Debit: %@", [funds valueForKey:@"debit"]]];
                [swipes setTitle:[NSString stringWithFormat:@"Swipes Left: %@", [funds valueForKey:@"swipes"]]];
                [sName setTitle:[studentInfo valueForKey:@"fullname"]];
                [sMajor setTitle:[studentInfo valueForKey:@"major"]];
                
                //This is being called from setup, hence the non -1ness
                if (pane != -1) {
                    [next setTitle:@"Finish"];
                    [next setHidden:NO];
                    [paneTitle setStringValue:@"Setup Complete"];
                    [[setup animator] replaceSubview:pane2 with:pane3];
                    pane = 3;
                    
                    ucardTimer = [NSTimer scheduledTimerWithTimeInterval:60 target:self selector:@selector(ucardUpdate:) userInfo:nil repeats:YES];
                }
            });
        });
    } else {
        NSLog(@"Failed to parse server responce. Aborting.");
    }
}

- (void)ucardUpdate:(NSTimer *)timer {
    NSData *authRaw = [NSData dataWithContentsOfURL:[NSURL URLWithString:[NSString stringWithFormat:@"%@/authStatus", sproxServer]]];
    NSDictionary *auth = [NSJSONSerialization JSONObjectWithData:authRaw options:0 error:nil];
    
    if ([[auth objectForKey:@"authStatus"] isEqualToString:@"valid"]) {
        [self postToURL:[NSURL URLWithString:[NSString stringWithFormat:@"%@/userInfo/ucard", sproxServer]]
         withParameters:[NSString stringWithFormat:@"username=%@&password=%@", username, password]
            andCallback:@selector(ucardInitialized:)];
    } else {
        [ucardTimer invalidate];
        
        [self postToURL:[NSURL URLWithString:[NSString stringWithFormat:@"%@/login", sproxServer]]
         withParameters:[NSString stringWithFormat:@"username=%@&password=%@", username, password]
            andCallback:@selector(authCompleted:)];
    }
}

#pragma mark Helpers

- (void)postToURL:(NSURL *)url withParameters:(NSString *)params andCallback:(SEL)callback {
    //Build the request
    params = [params stringByAppendingString:@"&api=true"];
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
        id respObj = [NSJSONSerialization JSONObjectWithData:resp options:0 error:nil];
        
        dispatch_async(dispatch_get_main_queue(), ^{
            //Check if we got a dictionary back
            if([respObj isKindOfClass:[NSDictionary class]]) {
                NSDictionary *_resp = respObj;

                //Perform the callback
                IMP imp = [self methodForSelector:callback];
                void (*_callback)(id, SEL, NSDictionary *) = (void *)imp;
                _callback(self, callback, _resp);
            } else {
                //Could not understand the servers responce, throw an error
                [NSError errorWithDomain:@"Error parsing responce from server" code:NSURLErrorDownloadDecodingFailedToComplete userInfo:nil];
            }
        });
    });
}

- (void)renderMenuItem {
    if (!statusRendered) {
        statusRendered = !statusRendered;
        
        statusItem = [[NSStatusBar systemStatusBar] statusItemWithLength:NSVariableStatusItemLength];
        NSImage *light = [NSImage imageNamed:@"statusDark"];
        NSImage *dark = [NSImage imageNamed:@"statusLight"];
        
        [light setTemplate:YES];
        [dark setTemplate:YES];
        
        [statusItem setImage:light];
        [statusItem setAlternateImage:dark];
        
        [statusItem setHighlightMode:YES];
        
        [statusItem setMenu:statusMenu];
    }
    
}

- (CATransition *)slideAnimation {
    CATransition *transition = [CATransition animation];
    [transition setType:kCATransitionMoveIn];
    [transition setSubtype:kCATransitionFromRight];
    return transition;
}

@end