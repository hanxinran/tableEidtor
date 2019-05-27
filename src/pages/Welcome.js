import styles from './index.less';
import React, { Component } from 'react';
import { supportsHistory } from 'history/DOMUtils';
// import styles from './style.scss'
import {Icon} from 'antd'
const getIndexFromEvent = (event, ignoredTarget = '') => {

  if (!isNaN(event)) {
    return event * 1
  } else if (ignoredTarget && event && event.target && event.target.dataset.role === ignoredTarget) {
    return false
  } else if (event && event.currentTarget && event.currentTarget.dataset.index) {
    return event.currentTarget.dataset.index * 1
  }

  return false

}
export default class Table extends Component {

  constructor(props){
    super(props)
    this.state={
      tableRows: [],
    colToolHandlers: [],
    rowToolHandlers: [],
    defaultColWidth: 0,
    colResizing: false,
    colResizeOffset: 0,
    selectedCells: [],
    selectedRowIndex: -1,
    selectedColumnIndex: -1,
    setFirstRowAsHead: false,
    dragSelecting: false,
    draggingRectBounding: null,
    cellsMergeable: false,
    cellSplittable: false,
    contextMenuPosition: null,


    tableData:[[],]
    }
  }







   __tableRef = null
  __colRefs = {}
  __rowRefs = {}

  __colResizeIndex = 0
  __colResizeStartAt = 0

  __startCellKey = null
  __endCellKey = null

  __dragSelecting = false
  __dragSelected = false
  __dragSelectingStartColumnIndex = null
  __dragSelectingStartRowIndex = null
  __dragSelectingEndColumnIndex = null
  __dragSelectingEndRowIndex = null
  __draggingRectBoundingUpdating = false
  __selectedCellsCleared = false
  

  handleToolbarMouseDown = (event) => {
    event.preventDefault()
  }

  handleKeyDown = (event) => {

    if (event.keyCode === 8) {

      const { selectedColumnIndex, selectedRowIndex } = this.state

      if (selectedColumnIndex > -1) {
        this.removeColumn()
        event.preventDefault()
      } else if (selectedRowIndex > -1) {
        this.removeRow()
        event.preventDefault()
      }

    }

  }

  handleMouseUp = (event) => {

    if (event.button !== 0) {
      return false
    }

    if (this.state.colResizing) {

      const { defaultColWidth, colToolHandlers, colResizeOffset } = this.state
      const nextColToolHandlers = [ ...colToolHandlers ]

      nextColToolHandlers[this.__colResizeIndex - 1].width = (nextColToolHandlers[this.__colResizeIndex - 1].width || defaultColWidth) + colResizeOffset
      nextColToolHandlers[this.__colResizeIndex].width = (nextColToolHandlers[this.__colResizeIndex].width || defaultColWidth) - colResizeOffset

      this.__colResizeIndex = 0
      this.__colResizeStartAt = 0

      this.setState({
        contextMenuPosition: null,
        colToolHandlers: nextColToolHandlers,
        colResizeOffset: 0,
        colResizing: false
      })

    } else {
      this.setState({
        contextMenuPosition: null
      })
    }

  }

  handleMouseMove = (event) => {

    if (this.state.colResizing) {
      this.setState({
        colResizeOffset: this.getResizeOffset(event.clientX - this.__colResizeStartAt)
      })
    }
    // if(this.state.resizeColIndex){
    //   console.log(this.state.startX,this.state.resizeColIndex,77665)
    // }
    console.log(this.state.startX,this.state.resizeColIndex,77665)

  }

  handleColResizerMouseDown = (event) => {

    this.__colResizeIndex = event.currentTarget.dataset.index * 1
    this.__colResizeStartAt = event.clientX
    this.setState({ colResizing: true })

  }

  handleCellContexrMenu = (event) => {

    const { selectedCells } = this.state
    const { cellKey } = event.currentTarget.dataset

    if (!~selectedCells.indexOf(cellKey)) {
      this.selectCell(event)
    }

    const { top: tableTop, left: tableLeft, width: tableWidth } = this.__tableRef.getBoundingClientRect()

    let top = event.clientY - tableTop + 15
    let left = event.clientX - tableLeft + 10

    if (left + 150 > tableWidth) {
      left = tableWidth - 150
    }

    this.setState({
      contextMenuPosition: { top, left }
    })

    event.preventDefault()

  }

  handleContextMenuContextMenu = (event) => {
    event.preventDefault()
  }

  handleCellMouseDown = (event) => {

    this.__dragSelecting = true
    this.__dragSelectingStartColumnIndex = event.currentTarget.dataset.colIndex
    this.__dragSelectingStartRowIndex = event.currentTarget.dataset.rowIndex

    this.__draggingStartPoint = {
      x: event.clientX,
      y: event.clientY
    }

    this.setState({
      dragSelecting: true
    })

  }

  handleCellMouseUp = () => {

    this.__dragSelecting = false
    this.__dragSelected = false
    this.__dragSelectingStartColumnIndex = null
    this.__dragSelectingStartRowIndex = null
    this.__dragSelectingEndColumnIndex = null
    this.__dragSelectingEndRowIndex = null

    this.setState({
      dragSelecting: false,
      draggingRectBounding: null
    })

  }

  handleCellMouseEnter = (event) => {

    if (this.__dragSelecting) {

      this.__dragSelectingEndColumnIndex = event.currentTarget.dataset.colIndex
      this.__dragSelectingEndRowIndex = event.currentTarget.dataset.rowIndex

      if (this.__dragSelectingEndColumnIndex !== this.__dragSelectingStartColumnIndex || this.__dragSelectingEndRowIndex !== this.__dragSelectingStartRowIndex) {
        this.__dragSelected = true
        event.preventDefault()
      } else {
        this.__dragSelected = false
      }
     

      this.confirmDragSelecting()

    }

  }

  handleTableMouseMove = (event) => {

    if (this.__dragSelecting && this.__dragSelected) {
      this.updateDraggingRectBounding(event)
      event.preventDefault()
    }

  }

  handleTableMouseLeave = (event) => {

    if (this.__dragSelecting && event.currentTarget && event.currentTarget.dataset.role === 'table') {
      this.handleCellMouseUp()
    }

    event.preventDefault()

  }

  confirmDragSelecting = () => {

    if (!this.__dragSelectingStartColumnIndex || !this.__dragSelectingStartRowIndex || !this.__dragSelectingEndColumnIndex || !this.__dragSelectingEndRowIndex) {
      return false
    }
    console.log( [this.__dragSelectingStartColumnIndex, this.__dragSelectingStartRowIndex],
      [this.__dragSelectingEndColumnIndex, this.__dragSelectingEndRowIndex],999)
      // debugger
    // const { cellKeys: selectedCells, spannedCellBlockKeys } = TableUtils.getCellsInsideRect(
    //   this.props.editorState, this.tableKey,
    //   [this.__dragSelectingStartColumnIndex, this.__dragSelectingStartRowIndex],
    //   [this.__dragSelectingEndColumnIndex, this.__dragSelectingEndRowIndex]
    // )
   

    // if (selectedCells.length < 2) {
    //   return false
    // }

    // this.setState({
    //   selectedColumnIndex: -1,
    //   selectedRowIndex: -1,
    //   cellsMergeable: spannedCellBlockKeys.length === 0,
    //   cellSplittable: false,
    //   selectedCells: selectedCells
    // }, this.renderCells)
    let startLocation = [this.__dragSelectingStartColumnIndex, this.__dragSelectingStartRowIndex]
    let endLocation = [this.__dragSelectingEndColumnIndex, this.__dragSelectingEndRowIndex]
    function getRenderKey(startLocation,endLocation){
      const [startColIndex, startRowIndex] = startLocation
      const [endColIndex, endRowIndex] = endLocation
    
      const leftColIndex = Math.min(startColIndex, endColIndex)
      const rightColIndex = Math.max(startColIndex, endColIndex)
      const upRowIndex = Math.min(startRowIndex, endRowIndex)
      const downRowIndex = Math.max(startRowIndex, endRowIndex)
    
      const matchedCellLocations = []
    
      for (let ii = leftColIndex;ii <= rightColIndex;ii++) {
        for (let jj = upRowIndex;jj <= downRowIndex;jj ++) {
          matchedCellLocations.push(ii+''+jj)
        }
      }
      console.log(matchedCellLocations,66888)
      return matchedCellLocations
    }

    let  selectKeys = getRenderKey(startLocation,endLocation)
     this.setState({
      selectedColumnIndex: -1,
      selectedRowIndex: -1,
      cellsMergeable: selectKeys.length != 0,
      cellSplittable: false,
      selectedCells: selectKeys
    })
   


  }

  updateDraggingRectBounding = (mouseEvent) => {

    if (this.__draggingRectBoundingUpdating || !this.__dragSelecting) {
      return false
    }

    this.__draggingRectBoundingUpdating = true

    const tableBounding = this.__tableRef.getBoundingClientRect()
    const { x: startX, y: startY } = this.__draggingStartPoint
    const { clientX: currentX, clientY: currentY } = mouseEvent

    const draggingRectBounding = {}

    if (currentX <= startX) {
      draggingRectBounding.right = tableBounding.left + tableBounding.width - startX
    } else {
      draggingRectBounding.left = startX - tableBounding.left + 9
    }

    if (currentY <= startY) {
      draggingRectBounding.bottom = tableBounding.top + tableBounding.height - startY
    } else {
      draggingRectBounding.top = startY - tableBounding.top + 9
    }

    draggingRectBounding.width = Math.abs(currentX - startX)
    draggingRectBounding.height = Math.abs(currentY - startY)

    this.setState({ draggingRectBounding }, () => {
      setTimeout(() => {
        this.__draggingRectBoundingUpdating = false
      }, 100)
    })

  }

  selectCell = (event) => {

    const { selectedCells } = this.state
    const { cellKey } = event.currentTarget.dataset
    const { colSpan, rowSpan } = event.currentTarget

    const nextSelectedCells = ~selectedCells.indexOf(cellKey) ? [] : [cellKey]
    const cellSplittable = nextSelectedCells.length && (colSpan > 1 || rowSpan > 1)

    this.setState({
      selectedCells: nextSelectedCells,
      cellSplittable: cellSplittable,
      cellsMergeable: false,
      selectedRowIndex: -1,
      selectedColumnIndex: -1,
    }, )

  }

  selectColumn = (event) => {

    const selectedColumnIndex = getIndexFromEvent(event, 'insert-column')

    if (selectedColumnIndex === false) {
      return false
    }

    if (this.state.selectedColumnIndex === selectedColumnIndex) {

      this.setState({
        selectedCells: [],
        cellsMergeable: false,
        cellSplittable: false,
        selectedColumnIndex: -1
      },)
      return false

    }

    // const { cellKeys: selectedCells, spannedCellBlockKeys } = TableUtils.getCellsInsideRect(
    //   this.props.editorState, this.tableKey,
    //   [selectedColumnIndex, 0],
    //   [selectedColumnIndex, this.state.rowToolHandlers.length - 1]
    // )

    this.setState({
      selectedColumnIndex: selectedColumnIndex,
      selectedRowIndex: -1,
      cellSplittable: false,
      // cellsMergeable: spannedCellBlockKeys.length === 0,
      // selectedCells: selectedCells
    },)

  }

  selectRow = (event) => {

    const selectedRowIndex = getIndexFromEvent(event, 'insert-row')

    if (selectedRowIndex === false) {
      return false
    }

    if (this.state.selectedRowIndex === selectedRowIndex) {
      this.setState({
        selectedCells: [],
        cellsMergeable: false,
        cellSplittable: false,
        selectedRowIndex: -1
      }, this.renderCells)
      return false
    }

    // const { cellKeys: selectedCells, spannedCellBlockKeys } = TableUtils.getCellsInsideRect(
    //   this.props.editorState, this.tableKey,
    //   [0, selectedRowIndex],
    //   [this.state.colToolHandlers.length, selectedRowIndex]
    // )

    this.setState({
      selectedColumnIndex: -1,
      selectedRowIndex: selectedRowIndex,
      // cellSplittable: false,
      // cellsMergeable: spannedCellBlockKeys.length === 0,
      // selectedCells: selectedCells
    }, )

  }

  insertColumn = (event) => {

    const columnIndex = getIndexFromEvent(event)
    let {tableData} = this.state 
    if (columnIndex === false) {
      return false
    }
    console.log(columnIndex,77)
    let newCell={colSpan:1,rowSpan:1,value:''}

    tableData=tableData.map((row,ind)=>{
      row.splice(columnIndex,0,newCell)
      return row
    })

    this.setState({
      selectedCells: [],
      selectedRowIndex: -1,
      selectedColumnIndex: -1
    }, )

  }

  removeColumn = () => {

    let { selectedColumnIndex,tableData} = this.state

    if (selectedColumnIndex >= 0) {
      tableData=tableData.map((row,ind)=>{
        row.splice(selectedColumnIndex,1,)
        return row
      })

      this.setState({
        selectedColumnIndex: -1,
        tableData
      },)

    }

  }

  insertRow = (event) => {
    let {tableData} = this.state
    let newCell={colSpan:1,rowSpan:1,value:''}
    let l=tableData[0].length
    let newRow=Array(l).fill(newCell)
    
    const rowIndex = getIndexFromEvent(event)
     
    if (rowIndex === false) {
      return false
    }
    tableData=tableData.splice(rowIndex,0,newRow)

    this.setState({
      tableData,
      selectedCells: [],
      selectedRowIndex: -1,
      selectedColumnIndex: -1
    }, )

  }

  removeRow = () => {

    const { selectedRowIndex,tableData} = this.state

    if (selectedRowIndex >= 0) {

      tableData.splice(selectedRowIndex,1)

      this.setState({
        tableData,
        selectedRowIndex: -1
      }, )

    }

  }
  resizeColumn=(index,e)=>{
    this.setState({resizeColIndex:index,startX:e.clientX})
  }
  
  mergeCells = () => {

    let { selectedCells, cellsMergeable,tableData} = this.state
    let  mergedText = ''
    
    if (cellsMergeable && selectedCells.length > 1) {
      let rowSpan =  selectedCells[selectedCells.length-1][1]*1+1
      let colSpan =  selectedCells[selectedCells.length-1][0]*1+1
     
      selectedCells.forEach((item,ind)=>{
        let col=item[0],row=item[1];
        let cell=tableData[row][col]
        if(ind==0){
          cell.rowSpan=rowSpan
          cell.colSpan=colSpan
        }else{
          cell.rowSpan=0
          cell.colSpan=0
        }
      })
      console.log(tableData,66)
      

      this.setState({
        selectedCells: [selectedCells[0]],
        cellSplittable: true,
        cellsMergeable: false,
        selectedRowIndex: -1,
        selectedColumnIndex: -1,
        tableData
      },)

    }

  }

  splitCell = () => {

    let { selectedCells, cellSplittable,tableData} = this.state
   
   
   console.log(1)
    if (cellSplittable && selectedCells.length === 1) {
      let a =selectedCells[0][0]
      let b= selectedCells[0][1]
      console.log(a,b,2)
   
      let {colIndex,rowIndex,rowSpan,colSpan} = tableData[a][b]
     
     
      for(let i=rowIndex;i<rowIndex+rowSpan;i++){
        for(let j=colIndex;j<colIndex+colSpan;j++){
          console.log(i,j)
          if(tableData[i][j]){
            tableData[i][j].rowSpan=1
            tableData[i][j].colSpan=1
          }
         
        }

      }

      console.log(tableData,7776)

      this.setState({
        tableData,
        cellSplittable: false,
        cellsMergeable: false,
        selectedRowIndex: -1,
        selectedColumnIndex: -1,
      }, )


    }

  }

  removeTable = () => {
    this.props.editor.setValue(TableUtils.removeTable(this.props.editorState, this.tableKey))
  }

  componentDidMount () {

    // this.renderCells(this.props)
   
    this.createTable({rowNum:3,colNum:3})

    document.body.addEventListener('keydown', this.handleKeyDown, false)
    document.body.addEventListener('mousemove', this.handleMouseMove, false)
    document.body.addEventListener('mouseup', this.handleMouseUp, false)

  }

  createTable(size){
    let {rowNum,colNum} = size
   
    let tableData=[];
    for(let r=0;r<rowNum;r++){
      tableData.push([])
      for(let c=0;c<colNum;c++){
        let res =this.createCell(r,c)
        
        tableData[r].push(res)
      }
    }
    console.log(tableData,77)
    this.setState({tableData})
    
  }

  createCell(rowIndex,colIndex){

    return {rowIndex,colIndex,rowSpan:1,colSpan:1,cellIndex:''+colIndex+rowIndex,value:''}
  }


  componentWillReceiveProps (nextProps) {
    // this.renderCells(nextProps)
  }

  componentWillUnmount () {

    document.body.removeEventListener('keydown', this.handleKeyDown, false)
    document.body.removeEventListener('mousemove', this.handleMouseMove, false)
    document.body.removeEventListener('mouseup', this.handleMouseUp, false)

  }

  getResizeOffset (offset) {

    let leftLimit = 0
    let rightLimit = 0

    const { colToolHandlers, defaultColWidth } = this.state

    leftLimit = -1 * ((colToolHandlers[this.__colResizeIndex - 1].width || defaultColWidth) - 30)
    rightLimit = (colToolHandlers[this.__colResizeIndex].width || defaultColWidth) - 30

    offset = offset < leftLimit ? leftLimit : offset
    offset = offset > rightLimit ? rightLimit : offset

    return offset

  }

  adjustToolbarHandlers () {

    let needUpdate = false
    const rowToolHandlers = [ ...this.state.rowToolHandlers ]

    Object.keys(this.__rowRefs).forEach((index) => {

      const rowHeight = this.__rowRefs[index] ? this.__rowRefs[index].getBoundingClientRect().height : 40

      if (rowToolHandlers[index] && rowToolHandlers[index].height !== rowHeight) {
        needUpdate = true
        rowToolHandlers[index].height = rowHeight
      }

    })

    if (needUpdate) {
      this.setState({ rowToolHandlers })
    }

  }

  renderCells (props) {

    props = props || this.props

    this.colLength = 0

    const tableRows = []
    const colToolHandlers = []
    const rowToolHandlers = []
   

    const { editorState, children } = props

    this.__startCellKey = children[0].key
    this.__endCellKey = children[children.length - 1].key

    children.forEach((cell, cellIndex) => {

      const cellBlock = editorState.getCurrentContent().getBlockForKey(cell.key)
      const cellBlockData = cellBlock.getData()
      const tableKey = cellBlockData.get('tableKey')
      const colIndex = cellBlockData.get('colIndex') * 1
      const rowIndex = cellBlockData.get('rowIndex') * 1
      const colSpan = cellBlockData.get('colSpan')
      const rowSpan = cellBlockData.get('rowSpan')

      this.tableKey = tableKey

      if (rowIndex === 0) {

        const colSpan = (cellBlockData.get('colSpan') || 1) * 1  

        for (var ii = this.colLength;ii < this.colLength + colSpan;ii ++) {
          colToolHandlers[ii] = {key: cell.key, width: 0}
        }

        this.colLength += colSpan

      }

      const newCell = React.cloneElement(cell, {
        'data-active': !!~this.state.selectedCells.indexOf(cell.key),
        'data-row-index': rowIndex,
        'data-col-index': colIndex || (tableRows[rowIndex] || []).length,
        'data-cell-index': cellIndex,
        'data-cell-key': cell.key,
        'data-table-key': tableKey,
        className: `bf-table-cell ${cell.props.className}`,
        colSpan: colSpan,
        rowSpan: rowSpan,
        onClick: this.selectCell,
        onContextMenu: this.handleCellContexrMenu,
        onMouseDown: this.handleCellMouseDown,
        onMouseUp: this.handleCellMouseUp,
        onMouseEnter: this.handleCellMouseEnter
      })

      for (var jj = rowIndex;jj < rowIndex + rowSpan; jj ++) {
        rowToolHandlers[jj] = {key: cell.key, height: 0}
        tableRows[jj] = tableRows[jj] || []
      }

      if (!tableRows[rowIndex]) {
        tableRows[rowIndex] = [newCell]
      } else {
        tableRows[rowIndex].push(newCell)
      }

    })

    const tableWidth = this.__tableRef.getBoundingClientRect().width
    const defaultColWidth = tableWidth / this.colLength

    this.setState({ tableRows, colToolHandlers, rowToolHandlers, defaultColWidth }, this.adjustToolbarHandlers)

  }

  createColGroup () {

    return (
      <colgroup>
        {this.state.colToolHandlers.map((item, index) => (
          <col ref={ref => this.__colRefs[index] = ref} width={item.width || this.state.defaultColWidth} key={index}></col>
        ))}
      </colgroup>
    )

  }

  createColTools =() =>{

    let  { colResizing, /*colResizeOffset,*/ colToolHandlers, selectedColumnIndex, defaultColWidth,tableData } = this.state
    colToolHandlers = tableData[0]
    console.log(this.__tableRef,88)
    if(this.__tableRef){
      const tableWidth = this.__tableRef.getBoundingClientRect().width
     defaultColWidth = tableWidth / tableData[0].length
    }
    
    return (
      <div
        data-active={selectedColumnIndex >= 0}
        contentEditable={false}
        data-key="bf-col-toolbar"
        className={`bf-table-col-tools${colResizing ? ' resizing' : ''}`}
        onMouseDown={this.handleToolbarMouseDown}
      >
        {colToolHandlers.map((item, index) => (
          <div
            key={index}
            data-key={item.key}
            data-index={index}
            data-active={selectedColumnIndex == index}
            className="bf-col-tool-handler"
            style={{width: item.width || defaultColWidth}}
            onClick={this.selectColumn}
          >
            {/*index !== 0 ? (
              <div
                data-index={index}
                data-key={item.key} 
                className={`bf-col-resizer${colResizing && this.__colResizeIndex === index ? ' active' : ''}`}
                style={colResizing && this.__colResizeIndex === index ? {transform: `translateX(${colResizeOffset}px)`} : null}
                onMouseDown={this.handleColResizerMouseDown}
              ></div>
            ) : null*/}
            <div className="bf-col-tool-left">
              <div
                data-index={index}
                data-role="insert-column"
                className="bf-insert-col-before"
                onClick={this.insertColumn}
              > 
              <Icon type="plus" />
                {/* <i className="bfi-add"></i> */}
              </div>
            </div>
            <div className="bf-col-tool-center">
              <div
                data-index={index}
                data-role="remove-col"
                className="bf-remove-col"
                onClick={this.removeColumn}
              >
                <i className="bfi-bin"></i>
              </div>
            </div>
            <div className="bf-col-tool-right">
              <div
                data-index={index + 1}
                data-role="insert-column"
                className="bf-insert-col-after"
                onClick={this.insertColumn}
              >
                <i className="bfi-add"></i>
              </div>
            </div>
            <div className="bf-col-tool-trigger"
             onMouseDown={(event)=>this.resizeColumn(index,event)}
            >
            </div>
          </div>
        ))}
      </div>
    )

  }

  createRowTools () {

    let  { rowToolHandlers, selectedRowIndex,tableData } = this.state
    let colLength=tableData.length
    let  defaultColHeight=0
    if(this.__tableRef){
      const tableHeight = this.__tableRef.getBoundingClientRect().height
      console.log(tableHeight,this.__tableRef.offsetHeight,666)
     defaultColHeight = 89 / colLength
    }
    
    rowToolHandlers = Array.from({length:colLength}).map((item,index)=> {return {key:index,}})
    console.log(defaultColHeight,rowToolHandlers,7776)
    // debugger

    return (
      <div
        data-active={selectedRowIndex >= 0}
        contentEditable={false}
        className="bf-table-row-tools"
        onMouseDown={this.handleToolbarMouseDown}
      >
        {rowToolHandlers.map((item, index) => (
          <div
            key={index}
            data-key={item.key}
            data-index={index}
            data-active={selectedRowIndex == index}
            className="bf-row-tool-handler"
            style={{height: defaultColHeight}}
            onClick={this.selectRow}
          >
            <div className="bf-row-tool-up">
              <div
                data-index={index}
                data-role="insert-row"
                className="bf-insert-row-before"
                onClick={this.insertRow}
              >
                <i className="bfi-add"></i>
              </div>
            </div>
            <div className="bf-row-tool-center">
              <div
                data-index={index}
                data-role="remove-row"
                className="bf-remove-row"
                onClick={this.removeRow}
              >
                <i className="bfi-bin"></i>
              </div>
            </div>
            <div className="bf-row-tool-down">
              <div
                data-index={index + 1}
                data-role="insert-row"
                className="bf-insert-row-after"
                onClick={this.insertRow}
              >
                <i className="bfi-add"></i>
              </div>
            </div>
          </div>
        ))}
      </div>
    )

  }

  createContextMenu () {

    const { cellsMergeable, cellSplittable, contextMenuPosition } = this.state

    if (!contextMenuPosition) {
      return null
    }

    return (
      <div className="bf-table-context-menu" onContextMenu={this.handleContextMenuContextMenu} contentEditable={false} style={contextMenuPosition}>
        <div className="context-menu-item" onMouseDown={this.mergeCells} data-disabled={!cellsMergeable}>{'合并单元格'}</div>
        <div className="context-menu-item" onMouseDown={this.splitCell} data-disabled={!cellSplittable}>{'拆分单元格'}</div>
        <div className="context-menu-item" onMouseDown={this.removeTable}>{'删除表格'}</div>
      </div>
    )

  }
 
  onSetCellValue = (event) =>{
    const { selectedCells,tableData } = this.state
    const { cellKey,rowIndex,colIndex} = event.currentTarget.parentNode.dataset
   
    tableData[rowIndex][colIndex].value = event.currentTarget.value
    this.setState({
      tableData
    })


   

  }

  renderRow=(cells,rowInd)=>{
  let {selectedCells} = this.state
  return cells.map((cell,i)=> {

      cell.rowIndex=rowInd;
      cell.colIndex=i
      cell.cellIndex=''+i+rowInd
      let {rowSpan,colSpan,rowIndex,colIndex,cellIndex} = cell;
      
      let style={}
      if(selectedCells.includes(cellIndex)){
        style={'border':'1px solid blue'}
      }
      
      let cellProps={
        'data-active': !!~this.state.selectedCells.indexOf(cell.key),
        'data-row-index': rowIndex,
        'data-col-index': colIndex,
        'data-cell-index': cellIndex,
        'data-cell-key': cellIndex,

        // 'data-table-key': tableKey,
        // className: `bf-table-cell ${cell.props.className}`,
        
        colSpan: colSpan,
        rowSpan: rowSpan,
        onClick: this.selectCell,
        onContextMenu: this.handleCellContexrMenu,
        onMouseDown: this.handleCellMouseDown,
        onMouseUp: this.handleCellMouseUp,
        onMouseEnter: this.handleCellMouseEnter
      }



     return !!cellProps.rowSpan && !!cellProps.colSpan && <td key={i} {...cellProps} style={style}> <input type="text" value={cell.value} onChange={(e)=>this.onSetCellValue(e)}/></td>
    })
  }




  render(){
    const { tableRows, dragSelecting, draggingRectBounding,tableData,selectedCells,contextMenuPosition} = this.state
    console.log(tableData,4433)
    return (
      <div className="bf-table-container">
     
        <table
          data-role="table"
          className={`bf-table${dragSelecting ? ' dragging' : ''}`}
         
          ref={ref => this.__tableRef = ref}
          onMouseDown={this.handleTableMouseDown}
          onMouseUp={this.hanldeTableMouseUp}
          onMouseMove={this.handleTableMouseMove}
          onMouseLeave={this.handleTableMouseLeave}
          
        >
          {this.createColGroup()}
          <tbody >
            {/* {tableRows.map((cells, rowIndex) => (
              <tr ref={ref => this.__rowRefs[rowIndex] = ref} key={rowIndex}>{cells}</tr>
            ))} */}
             {tableData.map((cells, rowIndex) => (
              <tr ref={ref => this.__rowRefs[rowIndex] = ref} key={rowIndex}>
                {this.renderRow(cells,rowIndex)}
              </tr>
            ))}
           
          </tbody>
        </table>

        {dragSelecting ? <div className="dragging-rect" style={draggingRectBounding}/> : null}
        {this.createContextMenu()}
        {this.createColTools()}
        {this.createRowTools()}
      </div>
    )
  }

}
