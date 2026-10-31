// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
declare var JSZip: any;
/**
 * @category SuiFile
 */
export class SuiFileInput {
  compressed: boolean = false;
  binary: boolean = false;
  value: any;
  event: any;
  /**
   * @param evt the change event of a file input
   * @param scoresAsBytes if true, read '.json' as well as '.smz' as bytes, so a score file can be
   * recognized by its contents rather than its name.  By default, only '.smz' (which is a zip, and
   * can't be read as text) is read as bytes.
   */
  constructor(evt: any, scoresAsBytes: boolean = false) {
    this.compressed = false;
    this.binary = false;
    this.value = null;
    this.event = evt;
    const name: string = evt.target.files[0].name.toLowerCase();
    if (name.endsWith('.mxl')) {
      this.compressed = true;
      this.binary = true;
    } else if (name.endsWith('.mid')) {
      this.binary = true;
    } else if (name.endsWith('.smz') || (scoresAsBytes && name.endsWith('.json'))) {
      this.binary = true;
    }
  }
  _handleZip() {
    const self = this;
    return new Promise<void>((resolve) => {
      JSZip.loadAsync(self.value).then((zip: any) => {
        // Find the real xml file in the zip (not metadata)
        const filename =
          Object.keys(zip.files).find((ss) => ss.indexOf('META') < 0 && ss.endsWith('xml'));
        zip.file(filename).async('text').then((str: any) => {
          self.value = str;
          resolve();
        });
      });
    });
  }
  loadAsync() {
    const self = this;
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (file) => {
        if (file === null || file.target === null || file.target.result === null) {
          reject();
          return;
        }
        self.value = file.target.result;
        if (!self.compressed) {
          resolve();
        } else {
          self._handleZip().then(() => {
            resolve();
          });
        }
      };
      if (self.binary) {
        reader.readAsArrayBuffer(self.event.target.files[0])
      } else {
        reader.readAsText(self.event.target.files[0]);
      }
    });
  }
}
