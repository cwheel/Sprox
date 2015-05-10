//
//  SetupView.m
//  Sprox
//
//  Created by Cameron Wheeler on 5/10/15.
//  Copyright (c) 2015 Cameron Wheeler. All rights reserved.
//

#import "SetupView.h"

@implementation SetupView

- (void)drawRect:(NSRect)dirtyRect {
    [super drawRect:dirtyRect];
    
    [[NSColor darkGrayColor] set];
    NSRectFill(dirtyRect);
}

@end
