#!/usr/bin/env python3
# test_imports_simple.py - Simple test without Unicode
import sys
try:
    import numpy
    print("numpy OK - version:", numpy.__version__)
except ImportError as e:
    print("numpy MISSING:", str(e))
    sys.exit(1)

try:
    import pandas  
    print("pandas OK - version:", pandas.__version__)
except ImportError as e:
    print("pandas MISSING:", str(e))
    sys.exit(1)

try:
    import scipy
    print("scipy OK - version:", scipy.__version__)
except ImportError as e:
    print("scipy MISSING:", str(e))
    sys.exit(1)

try:
    import sklearn
    print("sklearn OK - version:", sklearn.__version__)
except ImportError as e:
    print("sklearn MISSING:", str(e))
    sys.exit(1)

print("ALL PACKAGES WORKING")
