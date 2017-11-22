@thesis: for svg 2 the data-* implementation is not finished yet.
@changes: when i added the svg 2 namespace to svg tags 
this workaround became deprecated. it could still be used if a user passes a string with older xmlns specified.!?
---> correction:
if the text is parsed with "text/html" as type, and the 
svg elements have the svg 2 namespace attribute set,
they will get a dataset as defined in svg 2 on w3c.
else if the text is parsed with "image/svg+xml" as type, and the svg elements have the svg 2 namespace attribute set, they wont get a dataset as defined in svg 2 on w3c.