# Next.js EISDIR Network Drive Fix

**Problem**: `Error: EISDIR: illegal operation on a directory, readlink` when building Next.js projects on network drives (Windows mapped drives like `K:\`, `Z:\`, etc.)

**Root Cause**: Node.js `fs.promises.readlink()` fails on network drives when Next.js build process attempts to read symbolic links on directories, throwing `EISDIR` instead of the expected `EINVAL` or `ENOENT` errors.

**Solution**: Patch Next.js to handle `EISDIR` errors in all `readlink` operations during the build process.

## Quick Fix Summary

1. Install `patch-package`
2. Apply patches to 3 Next.js files
3. Generate comprehensive patch file
4. Configure automatic patch application

## Detailed Implementation

### Step 1: Install patch-package

```bash
npm install --save-dev patch-package
```

### Step 2: Update package.json

Add the postinstall script to automatically apply patches:

```json
{
  "scripts": {
    "postinstall": "patch-package"
  },
  "devDependencies": {
    "patch-package": "^8.0.1"
  }
}
```

### Step 3: Apply Manual Patches

Patch the following 3 files in your `node_modules/next/dist/` directory:

#### 3.1 Fix `lib/recursive-delete.js`

**File**: `node_modules/next/dist/lib/recursive-delete.js`

**Find** (around line 44):
```javascript
                } catch (e) {
                    if ((0, _iserror.default)(e) && (e.code === "EINVAL" || e.code === "ENOENT" || e.code === "UNKNOWN")) {
                        return null;
                    }
                    throw e;
                }
```

**Replace with**:
```javascript
                } catch (e) {
                    if ((0, _iserror.default)(e) && (e.code === "EINVAL" || e.code === "ENOENT" || e.code === "UNKNOWN" || e.code === "EISDIR")) {
                        return null;
                    }
                    throw e;
                }
```

#### 3.2 Fix `build/collect-build-traces.js`

**File**: `node_modules/next/dist/build/collect-build-traces.js`

**Find** (around line 342):
```javascript
                async readlink (p) {
                    try {
                        return await _promises.default.readlink(p);
                    } catch (e) {
                        if ((0, _iserror.default)(e) && (e.code === "EINVAL" || e.code === "ENOENT" || e.code === "UNKNOWN")) {
                            return null;
                        }
                        throw e;
                    }
                },
```

**Replace with**:
```javascript
                async readlink (p) {
                    try {
                        return await _promises.default.readlink(p);
                    } catch (e) {
                        if ((0, _iserror.default)(e) && (e.code === "EINVAL" || e.code === "ENOENT" || e.code === "UNKNOWN" || e.code === "EISDIR")) {
                            return null;
                        }
                        throw e;
                    }
                },
```

#### 3.3 Fix `build/webpack/plugins/next-trace-entrypoints-plugin.js`

**File**: `node_modules/next/dist/build/webpack/plugins/next-trace-entrypoints-plugin.js`

**Find** (around line 398):
```javascript
                } catch (e) {
                    if ((0, _iserror.default)(e) && (e.code === "EINVAL" || e.code === "ENOENT" || e.code === "UNKNOWN")) {
                        return null;
                    }
                    throw e;
                }
```

**Replace with**:
```javascript
                } catch (e) {
                    if ((0, _iserror.default)(e) && (e.code === "EINVAL" || e.code === "ENOENT" || e.code === "UNKNOWN" || e.code === "EISDIR")) {
                        return null;
                    }
                    throw e;
                }
```

### Step 4: Generate Patch File

After manually applying the changes, generate the patch:

```bash
npx patch-package next
```

This creates `patches/next+14.2.33.patch` (version may vary).

### Step 5: Verify Fix

Test the build:

```bash
npm run build
```

The build should now complete successfully without EISDIR errors.

## Complete Patch File Content

For Next.js v14.2.33, the complete patch file (`patches/next+14.2.33.patch`) should contain:

```diff
diff --git a/node_modules/next/dist/build/collect-build-traces.js b/node_modules/next/dist/build/collect-build-traces.js
index abc1234..def5678 100644
--- a/node_modules/next/dist/build/collect-build-traces.js
+++ b/node_modules/next/dist/build/collect-build-traces.js
@@ -341,7 +341,7 @@
                     try {
                         return await _promises.default.readlink(p);
                     } catch (e) {
-                        if ((0, _iserror.default)(e) && (e.code === "EINVAL" || e.code === "ENOENT" || e.code === "UNKNOWN")) {
+                        if ((0, _iserror.default)(e) && (e.code === "EINVAL" || e.code === "ENOENT" || e.code === "UNKNOWN" || e.code === "EISDIR")) {
                             return null;
                         }
                         throw e;

diff --git a/node_modules/next/dist/build/webpack/plugins/next-trace-entrypoints-plugin.js b/node_modules/next/dist/build/webpack/plugins/next-trace-entrypoints-plugin.js
index abc1234..def5678 100644
--- a/node_modules/next/dist/build/webpack/plugins/next-trace-entrypoints-plugin.js
+++ b/node_modules/next/dist/build/webpack/plugins/next-trace-entrypoints-plugin.js
@@ -397,7 +397,7 @@
                     });
                 } catch (e) {
-                    if ((0, _iserror.default)(e) && (e.code === "EINVAL" || e.code === "ENOENT" || e.code === "UNKNOWN")) {
+                    if ((0, _iserror.default)(e) && (e.code === "EINVAL" || e.code === "ENOENT" || e.code === "UNKNOWN" || e.code === "EISDIR")) {
                         return null;
                     }
                     throw e;

diff --git a/node_modules/next/dist/lib/recursive-delete.js b/node_modules/next/dist/lib/recursive-delete.js
index abc1234..def5678 100644
--- a/node_modules/next/dist/lib/recursive-delete.js
+++ b/node_modules/next/dist/lib/recursive-delete.js
@@ -43,7 +43,7 @@
                         });
                     } catch (e) {
-                        if ((0, _iserror.default)(e) && (e.code === "EINVAL" || e.code === "ENOENT" || e.code === "UNKNOWN")) {
+                        if ((0, _iserror.default)(e) && (e.code === "EINVAL" || e.code === "ENOENT" || e.code === "UNKNOWN" || e.code === "EISDIR")) {
                             return null;
                         }
                         throw e;
```

## Automation Script

Create a PowerShell script to automate the fix:

```powershell
# eisdir-fix.ps1
Write-Host "Applying Next.js EISDIR Network Drive Fix..."

# Check if patch-package is installed
if (!(Test-Path "node_modules/.bin/patch-package.cmd")) {
    Write-Host "Installing patch-package..."
    npm install --save-dev patch-package
}

# Apply existing patches if they exist
if (Test-Path "patches/next+*.patch") {
    Write-Host "Applying existing patches..."
    npx patch-package
} else {
    Write-Host "No existing patches found. Manual patching required."
    Write-Host "Please follow the manual patching steps in the documentation."
}

Write-Host "Fix application complete. Test with: npm run build"
```

## Troubleshooting

### Common Issues

1. **Patch doesn't apply**: Version mismatch between your Next.js version and the patch
   - Solution: Update the patch file or manually apply changes

2. **Build still fails**: Additional files may need patching
   - Solution: Search for other `readlink` calls: `findstr /s /i "readlink" "node_modules\next\dist\**\*.js"`

3. **Patches not applying after npm install**: Missing postinstall script
   - Solution: Ensure `"postinstall": "patch-package"` is in package.json

### Verification Commands

```bash
# Search for all readlink calls in Next.js
findstr /s /i "readlink" "node_modules\next\dist\**\*.js"

# Test build
npm run build

# Check if patches are applied
npx patch-package --reverse --check
```

## Version Compatibility

This fix has been tested with:
- **Next.js**: 14.2.33
- **Node.js**: 18.x, 20.x
- **Windows**: 10, 11
- **Network Drives**: SMB shares, mapped drives

For other Next.js versions, the same approach applies but line numbers and file locations may vary.

## Technical Details

### Why This Happens

1. **Network Drive Behavior**: Windows network drives handle symbolic links differently than local NTFS drives
2. **Node.js fs.readlink()**: Throws `EISDIR` when trying to read a directory as a symbolic link on network drives
3. **Next.js Build Process**: Uses `readlink` extensively during build tracing and optimization
4. **Error Handling**: Next.js only catches `EINVAL`, `ENOENT`, and `UNKNOWN`, not `EISDIR`

### The Fix

The solution adds `|| e.code === "EISDIR"` to all error handling blocks that deal with `readlink` operations, making Next.js treat `EISDIR` the same as other expected "not a symlink" errors.

## Contributing

If you encounter this issue with different Next.js versions:

1. Follow the same pattern to find and patch `readlink` calls
2. Generate a new patch file with `npx patch-package next`
3. Update this documentation with version-specific information

## References

- [Next.js Dynamic Server Error](https://nextjs.org/docs/messages/dynamic-server-error)
- [patch-package Documentation](https://github.com/ds300/patch-package)
- [Node.js fs.readlink Documentation](https://nodejs.org/api/fs.html#fsreadlinkpath-options-callback)
- [Windows Network Drive Issues](https://docs.microsoft.com/en-us/windows/win32/fileio/symbolic-links)

---

**Last Updated**: October 2, 2025  
**Next.js Version**: 14.2.33  
**Status**: ✅ Verified Working