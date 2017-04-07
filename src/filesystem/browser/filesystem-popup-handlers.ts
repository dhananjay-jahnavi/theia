import { Path } from "../common/path";
import { FileSystem } from "../common/file-system";
import { PopupService } from "../../application/common/popup-service";

export function promptNamePopup(commandId: string, pathFrom: Path, popupService: PopupService, fileSystem: FileSystem): void {
    let submitButton: HTMLInputElement
    let inputText: HTMLInputElement
    let errorMessage: HTMLElement
    let parent: HTMLElement

    let isFree = true
    let isValid = true
    let resultName: Path | undefined

    popupService.createPopup({
        id: commandId,
        title: 'Enter new name',
        content: `
            <form class='changeNameInputContainer'>
                <input class='popupButton' id='popupChangeNameInput' type=text value='' />
                <input class='popupButton main' id='popupChangeNameSubmit' type=submit value='Submit' />
                <div id='popupChangeErrorMessage'></div>
            </form>`,
        initCallback: () => {
            submitButton = <HTMLInputElement>document.getElementById('popupChangeNameSubmit')
            inputText = <HTMLInputElement>document.getElementById('popupChangeNameInput')
            errorMessage = <HTMLElement>document.getElementById('popupChangeErrorMessage')
            if (!submitButton || !inputText || !errorMessage) {
                return false
            }
            parent = <HTMLElement>inputText.parentElement

            if (!parent) {
                return false
            }
            let validationHandler = () => {
                if (inputText.value === pathFrom.simpleName) {
                    parent.classList.remove('error')
                    isValid = true
                    isFree = true
                }
                if (!inputText.value.match(/^[\w\-. ]+$/)) {
                    parent.classList.add('error')
                    errorMessage.innerHTML = "Invalid name, try other"
                    isValid = false
                } else {
                    parent.classList.remove('error')
                    isValid = true
                    let fsNameTest: Path = pathFrom.parent.append(inputText.value)
                    // 'trying to check name existance'
                    fileSystem.exists(fsNameTest).then((doExist: boolean) => {
                        if (doExist) {
                            // 'name does exist'
                            parent.classList.add('error')
                            parent.classList.remove('valid')
                            errorMessage.innerHTML = "This name is already exist"
                            submitButton.disabled = true
                        } else {
                            // 'can create new name'
                            parent.classList.remove('error')
                            parent.classList.add('valid')
                            submitButton.disabled = false
                            resultName = fsNameTest
                        }
                        isFree = !doExist
                    })
                }
            }
            let submitHandler = () => {
                if (inputText.value === pathFrom.simpleName && !resultName) {
                    popupService.removePopup(commandId)
                    return
                }
                if (isValid && isFree && resultName) {
                    fileSystem.rename(pathFrom, resultName).then((success) => {
                        if (success) {
                            popupService.removePopup(commandId)
                        } else {
                            parent.classList.remove('valid')
                            parent.classList.add('error')
                            errorMessage.innerHTML = "Rename didn't work"
                        }
                    }).catch((error) => {
                        if (error) {
                            parent.classList.add('error')
                            errorMessage.innerHTML = `${commandId} failed with message: ${error}`
                        }
                    })
                }
            }

            inputText.addEventListener('input', (e: Event) => {
                if (inputText instanceof HTMLInputElement && parent instanceof HTMLElement) {
                    validationHandler()
                }
            })

            parent.addEventListener('submit', (e: Event) => {
                submitHandler()
                e.preventDefault()
                return false
            })

            inputText.focus()
            if (pathFrom.simpleName) {
                inputText.value = pathFrom.simpleName
            }
        },
        cancelCallback: () => {
            isFree = false
            isValid = false
            parent.classList.remove('error')
            parent.classList.remove('valid')
            if (resultName && resultName.simpleName) {
                inputText.value = resultName.simpleName
            } else if (pathFrom && pathFrom.simpleName) {
                inputText.value = pathFrom.simpleName
            }
        }
    })
    popupService.showPopup(commandId)
}

export function promptConfirmPopup(commandId: string, actionCallback: any, popupService: PopupService, fileSystem: FileSystem): void {
    let submitButton: HTMLInputElement
    let cancelButton: HTMLInputElement
    popupService.createPopup({
        id: commandId,
        title: 'Confirm the action',
        content: `
            <form class='confirmInputContainer'>
                <input class='popupButton' id='popupConfirmCancel' type=submit value='Cancel' />
                <input class='popupButton main' id='popupConfirmSubmit' type=submit value='Confirm' />
            </form>`,
        initCallback: () => {
            submitButton = <HTMLInputElement>document.getElementById('popupConfirmSubmit')
            cancelButton = <HTMLInputElement>document.getElementById('popupConfirmCancel')

            if (!submitButton || !cancelButton) {
                return false
            }

            submitButton.addEventListener('click', (e: Event) => {
                actionCallback()
                popupService.removePopup(commandId)
            })

            cancelButton.addEventListener('click', (e: Event) => {
                popupService.removePopup(commandId)
            })
            submitButton.focus()
        },
        cancelCallback: () => {
            popupService.removePopup(commandId)
        }
    })
    popupService.showPopup(commandId)
}