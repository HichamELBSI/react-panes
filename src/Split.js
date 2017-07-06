import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';

const containerStyles = (horizontal) => ({
  display: 'flex',
  flexDirection: horizontal ? 'column' : 'row',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
});

const separator = {
  cursor: 'col-resize',
  height: 'auto',
  width: 10,
  backgroundColor: '#f7f7f7',
  flex: '0 0 auto',
  borderLeft: '1px solid rgb(236, 236, 236)',
  borderRight: '1px solid rgb(236, 236, 236)',
};
const horizontalSeparator = {
  cursor: 'row-resize',
  height: 10,
  width: 'auto',
  backgroundColor: '#f7f7f7',
  borderTop: '1px solid rgb(236, 236, 236)',
  borderBottom: '1px solid rgb(236, 236, 236)',
}

const panelStyle = {
  flex: 1,
  // width: '33.33%'
};

const startDraggingPane = index => state => ({
  ...state,
  dragging: true,
  paneDragging: index
});

const stopDragging = state => ({
  ...state,
  dragging: false,
  paneDragging: null,
});

const getBounds = pane => ({
  width: pane.getBoundingClientRect().width,
  height: pane.getBoundingClientRect().height,
  top: pane.getBoundingClientRect().top,
  left: pane.getBoundingClientRect().left,
  right: pane.getBoundingClientRect().right,
  bottom: pane.getBoundingClientRect().bottom,
})

class Split extends Component {
  constructor(props) {
    super(props);
    this.state = {
      panes: {},
      dragging: false,
      paneDragging: null,
    };
    this.panes = {};
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  componentDidMount() {
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('mouseup', this.onMouseUp)

    // save current pane sizes
    this.setState(state => {
      return {
        ...state,
        panes: Object.keys(this.panes).reduce((acc, key) => {
          acc[key] = {
            size: getBounds(this.panes[key]),
          };
          return acc;
        }, {}),
      }
    })
  }

  onMouseDown(event, index) {
    this.setState(startDraggingPane(index));
  }

  onMouseUp(event) {
    this.setState(stopDragging);
  }

  onMouseMove(event) {
    const {horizontal} = this.props;
    const {
      dragging,
      paneDragging,
    } = this.state;

    if (dragging === true && paneDragging !== null) {
      const currentPaneSize = getBounds(this.panes[paneDragging]);

      let eventClient;
      if (horizontal) {
        eventClient = event.clientY;
      } else {
        eventClient = event.clientX;
      }

      if (!horizontal && eventClient < currentPaneSize.left + 10) return;
      if (horizontal && eventClient < currentPaneSize.top + 10) return;

      const newWdith = eventClient - currentPaneSize.left - 10;
      const newHeight = eventClient - currentPaneSize.top - 10;
      const newWidthOrHeight = horizontal ? newHeight : newWdith;

      const prevPaneIndex = paneDragging - 1;
      if (this.panes[prevPaneIndex]) {
        const prevPaneSide = horizontal
          ? getBounds(this.panes[prevPaneIndex]).bottom
          : getBounds(this.panes[prevPaneIndex]).right;
        if (eventClient <= prevPaneSide + 30) return;
      }

      const nextPaneIndex = paneDragging + 1;
      const nextPaneSide = horizontal
        ? getBounds(this.panes[nextPaneIndex]).bottom
        : getBounds(this.panes[nextPaneIndex]).right;
      if (this.panes[nextPaneIndex]) {
        if (eventClient >= nextPaneSide - 10) return;

        const nextPaneSize =  getBounds(this.panes[nextPaneIndex]);
        const nextPaneWidth = nextPaneSize.width + (currentPaneSize.width - newWidthOrHeight);
        const nextPaneHeight = nextPaneSize.height + (currentPaneSize.height - newWidthOrHeight);
        this.setState(state => {
          state.panes[nextPaneIndex].size = {
          ...nextPaneSize,
          width: nextPaneWidth,
          height: nextPaneHeight,
        };

        return state;
      });
      }

      this.setState(state => {
        state.panes[paneDragging].size = {
          ...currentPaneSize,
          width: newWidthOrHeight,
          height: newWidthOrHeight
        };

        return state;
      });
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('mouseup', this.onMouseUp)
  }

  render() {
    const {horizontal} = this.props;
    const ch = Children.map(this.props.children, (child, index) => {
      const pane = this.state.panes[index];

      let style = panelStyle;

      if (pane && pane.size) {
        style = {
          ...style,
          flex: 'none',
          width: !horizontal ? pane.size.width : null,
          height: horizontal ? pane.size.height : null,
        };
      }

      const res = [
        <div ref={pane => (this.panes[index] = pane)} style={style}>
          {child}
        </div>,
      ];

      if (index < Children.count(this.props.children) - 1)
        return res.concat(
          <span
            style={horizontal ? horizontalSeparator : separator}
            onMouseDown={e => this.onMouseDown(e, index)}
            onMouseMove={e => this.onMouseMove(e, index)}
          />
        );

      return res;
    });

    return (
      <div style={containerStyles(horizontal)}>
        {ch}
      </div>
    );
  }
}

Split.propTypes = {
    horizontal: PropTypes.bool,
}
Split.defaultProps = {
    horizontal: false,
};

export default Split;
